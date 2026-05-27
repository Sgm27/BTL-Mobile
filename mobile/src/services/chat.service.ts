import { api, extractData } from './api';

export interface ChatMessageItem {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface ChatSessionItem {
  id: string;
  title: string | null;
  summary: string | null;
  lastMessage: {
    content: string;
    role: 'USER' | 'ASSISTANT';
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMessagesResponse {
  session: {
    id: string;
    title: string | null;
    summary: string | null;
    createdAt: string;
  };
  messages: ChatMessageItem[];
}

export interface SymptomExtractionResponse {
  symptoms: string[];
  suggestedSpecialties: {
    id: string;
    name: string;
    description: string | null;
  }[];
  urgency: string;
  reasoning: string;
}

export async function getChatSessions(): Promise<ChatSessionItem[]> {
  const response = await api.get('/ai/chat/sessions');
  return extractData<ChatSessionItem[]>(response);
}

export async function getSessionMessages(
  sessionId: string
): Promise<SessionMessagesResponse> {
  const response = await api.get(`/ai/chat/sessions/${sessionId}`);
  return extractData<SessionMessagesResponse>(response);
}

export async function extractSymptoms(
  text: string
): Promise<SymptomExtractionResponse> {
  const response = await api.post('/ai/symptoms', { text });
  return extractData<SymptomExtractionResponse>(response);
}
