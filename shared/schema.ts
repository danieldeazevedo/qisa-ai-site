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
  title: z.string().default("Nova Conversa"),
});

export const insertMessageSchema = z.object({
  sessionId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  imageUrl: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string(),
    type: z.enum(['pdf', 'image', 'other']),
    uploadedAt: z.date(),
    processedContent: z.string().optional(),
  })).optional(),
});

export const qkoinTransactionSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  type: z.enum(['earned', 'spent', 'daily_reward']),
  description: z.string(),
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
  qkoins: number;
  lastDailyReward: Date | null;
  lastBonusClaim: Date | null;
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
  attachments?: FileAttachment[];
};

export type FileAttachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: 'pdf' | 'image' | 'other';
  uploadedAt: Date;
  processedContent?: string;
  filePath?: string;
  extractedText?: string;
};

export type QkoinTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'spent' | 'daily_reward';
  description: string;
  createdAt: Date;
};

export type InsertQkoinTransaction = z.infer<typeof qkoinTransactionSchema>;

// System configuration schema
export const systemConfigSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().default("Estamos em manutenção. Tente novamente mais tarde."),
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;