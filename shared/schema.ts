import { z } from "zod";

// Redis-based schema definitions - no Drizzle needed
export const insertUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().nullable().optional(),
  photoURL: z.string().nullable().optional(),
});

export const loginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const insertChatSessionSchema = z.object({
  userId: z.string(),
  title: z.string(),
});

export const insertMessageSchema = z.object({
  sessionId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  imageUrl: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
};

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl: string | null;
  metadata: any | null;
  createdAt: Date;
};