import { prisma } from '../../config/database';
import { chatCompletion } from '../../utils/ai-client';
import { AppError } from '../../utils/app-error';
import type { ChatMessageRole } from '@prisma/client';

const SYSTEM_PROMPT = `You are a medical assistant chatbot for a clinic appointment system.
- Ask clarifying questions about symptoms (2-3 questions max)
- After gathering info, suggest which medical specialty to visit
- Always include disclaimer: this is not a medical diagnosis
- Be concise and friendly
- Respond in the same language the user writes in`;

const SYMPTOM_EXTRACTION_PROMPT = `You are a medical triage assistant. Given the user's symptom description, extract the key symptoms and suggest the most appropriate medical specialty (or specialties) to visit.

Respond in JSON format only:
{
  "symptoms": ["symptom1", "symptom2"],
  "suggestedSpecialties": ["Specialty Name 1"],
  "urgency": "low" | "medium" | "high",
  "reasoning": "Brief explanation"
}

Use the specialty names exactly as they appear in the database when possible.`;

export class AiService {
  static async sendChatMessage(userId: string, sessionId: string | undefined, message: string) {
    // Create session if needed
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (!session) {
        throw AppError.notFound('Chat session not found');
      }
    } else {
      session = await prisma.chatSession.create({
        data: {
          userId,
          title: message.slice(0, 100),
        },
      });
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'USER' as ChatMessageRole,
        content: message,
      },
    });

    // Build conversation history for AI
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    const aiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((msg) => ({
        role: (msg.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call AI
    const aiResponseText = await chatCompletion(aiMessages);

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'ASSISTANT' as ChatMessageRole,
        content: aiResponseText,
      },
    });

    // Update session title if it's the first message
    if (!sessionId) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { title: message.slice(0, 100) },
      });
    }

    return {
      sessionId: session.id,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      aiMessage: {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt,
      },
    };
  }

  static async getChatSessions(userId: string) {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      summary: session.summary,
      lastMessage: session.messages[0] ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
  }

  static async getSessionMessages(userId: string, sessionId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw AppError.notFound('Chat session not found');
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return {
      session: {
        id: session.id,
        title: session.title,
        summary: session.summary,
        createdAt: session.createdAt,
      },
      messages,
    };
  }

  static async extractSymptoms(text: string) {
    // Get all specialties from DB for context
    const specialties = await prisma.specialty.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, description: true, symptoms: true },
    });

    const specialtyContext = specialties
      .map((s) => `- ${s.name}: ${s.symptoms.join(', ')}`)
      .join('\n');

    const prompt = `${SYMPTOM_EXTRACTION_PROMPT}\n\nAvailable specialties:\n${specialtyContext}\n\nUser symptoms: ${text}`;

    const aiResponse = await chatCompletion([
      { role: 'system', content: prompt },
      { role: 'user', content: text },
    ], { temperature: 0.3 });

    // Parse JSON from AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      const parsed = JSON.parse(jsonMatch[0]) as {
        symptoms: string[];
        suggestedSpecialties: string[];
        urgency: string;
        reasoning: string;
      };

      // Match suggested specialties with DB records
      const matchedSpecialties = specialties.filter((s) =>
        parsed.suggestedSpecialties.some(
          (suggested) => s.name.toLowerCase() === suggested.toLowerCase()
        )
      );

      return {
        symptoms: parsed.symptoms,
        suggestedSpecialties: matchedSpecialties.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
        })),
        urgency: parsed.urgency,
        reasoning: parsed.reasoning,
      };
    } catch {
      // If AI response isn't valid JSON, return raw text
      return {
        symptoms: [],
        suggestedSpecialties: [],
        urgency: 'medium',
        reasoning: aiResponse,
      };
    }
  }
}
