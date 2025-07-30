import { type User, type InsertUser, type ChatSession, type InsertChatSession, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat session methods
  getCurrentSession(userId: string): Promise<ChatSession>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  deleteChatSession(sessionId: string): Promise<void>;
  
  // Message methods
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseId === firebaseId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getCurrentSession(userId: string): Promise<ChatSession> {
    // Find or create current session for user
    const existingSession = Array.from(this.chatSessions.values())
      .find(session => session.userId === userId);
    
    if (existingSession) {
      return existingSession;
    }

    // Create new session
    const sessionId = randomUUID();
    const now = new Date();
    const session: ChatSession = {
      id: sessionId,
      userId,
      title: "Nova Conversa",
      createdAt: now,
      updatedAt: now,
    };
    
    this.chatSessions.set(sessionId, session);
    return session;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const now = new Date();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    this.chatSessions.delete(sessionId);
    // Also delete all messages in this session
    const messagesToDelete: string[] = [];
    this.messages.forEach((message, messageId) => {
      if (message.sessionId === sessionId) {
        messagesToDelete.push(messageId);
      }
    });
    messagesToDelete.forEach(messageId => this.messages.delete(messageId));
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      metadata: insertMessage.metadata || null,
      imageUrl: insertMessage.imageUrl || null,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    
    // Update session updatedAt
    const session = this.chatSessions.get(insertMessage.sessionId);
    if (session) {
      session.updatedAt = new Date();
      this.chatSessions.set(session.id, session);
    }
    
    return message;
  }
}

export const storage = new MemStorage();
