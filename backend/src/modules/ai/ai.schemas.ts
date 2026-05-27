import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(2000),
  }),
});

export const getSessionMessagesSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const extractSymptomsSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(2000),
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type ExtractSymptomsInput = z.infer<typeof extractSymptomsSchema>['body'];
