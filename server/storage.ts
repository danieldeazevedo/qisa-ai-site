import { type User, type InsertUser, type ChatSession, type InsertChatSession, type Message, type InsertMessage } from "@shared/schema";
import { client, connectRedis } from "./db";
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



export class RedisStorage implements IStorage {
  private fallbackStorage: Map<string, any> = new Map();

  constructor() {
    console.log('🚀 Storage initialized with Redis fallback support');
    console.log('🔗 Redis URL configured:', process.env.REDIS_URL ? 'Yes' : 'No');
  }

  private async withFallback<T>(redisOperation: () => Promise<T>, fallbackOperation: () => T | Promise<T>): Promise<T> {
    try {
      await connectRedis();
      return await redisOperation();
    } catch (error) {
      // Use fallback silently
      return await Promise.resolve(fallbackOperation());
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.withFallback(
      async () => {
        const userJson = await client.get(`user:${id}`);
        return userJson ? JSON.parse(userJson) : undefined;
      },
      () => {
        const userJson = this.fallbackStorage.get(`user:${id}`);
        return userJson ? JSON.parse(userJson) : undefined;
      }
    );
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return this.withFallback(
      async () => {
        const userId = await client.get(`firebase:${firebaseId}`);
        return userId ? this.getUser(userId) : undefined;
      },
      async () => {
        const userId = this.fallbackStorage.get(`firebase:${firebaseId}`);
        return userId ? await this.getUser(userId) : undefined;
      }
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
    
    return this.withFallback(
      async () => {
        await client.set(`user:${id}`, JSON.stringify(user));
        await client.set(`firebase:${insertUser.firebaseId}`, id);
        return user;
      },
      () => {
        this.fallbackStorage.set(`user:${id}`, JSON.stringify(user));
        this.fallbackStorage.set(`firebase:${insertUser.firebaseId}`, id);
        return user;
      }
    );
  }

  async getCurrentSession(userId: string): Promise<ChatSession> {
    return this.withFallback(
      async () => {
        // Get user's current session
        const sessionId = await client.get(`user:${userId}:current_session`);
        
        if (sessionId) {
          const sessionJson = await client.get(`session:${sessionId}`);
          if (sessionJson) {
            return JSON.parse(sessionJson);
          }
        }

        // Create new session
        const newSessionId = randomUUID();
        const now = new Date();
        const session: ChatSession = {
          id: newSessionId,
          userId,
          title: "Nova Conversa",
          createdAt: now,
          updatedAt: now,
        };
        
        await client.set(`session:${newSessionId}`, JSON.stringify(session));
        await client.set(`user:${userId}:current_session`, newSessionId);
        await client.sAdd(`user:${userId}:sessions`, newSessionId);
        
        return session;
      },
      () => {
        // Fallback logic
        const sessionId = this.fallbackStorage.get(`user:${userId}:current_session`);
        
        if (sessionId) {
          const sessionJson = this.fallbackStorage.get(`session:${sessionId}`);
          if (sessionJson) {
            return JSON.parse(sessionJson);
          }
        }

        // Create new session
        const newSessionId = randomUUID();
        const now = new Date();
        const session: ChatSession = {
          id: newSessionId,
          userId,
          title: "Nova Conversa",
          createdAt: now,
          updatedAt: now,
        };
        
        this.fallbackStorage.set(`session:${newSessionId}`, JSON.stringify(session));
        this.fallbackStorage.set(`user:${userId}:current_session`, newSessionId);
        
        return session;
      }
    );
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    await connectRedis();
    const id = randomUUID();
    const now = new Date();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    await client.set(`session:${id}`, JSON.stringify(session));
    await client.sAdd(`user:${insertSession.userId}:sessions`, id);
    return session;
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await connectRedis();
    // Get session to find userId
    const sessionJson = await client.get(`session:${sessionId}`);
    if (sessionJson) {
      const session: ChatSession = JSON.parse(sessionJson);
      
      // Delete all messages in session
      const messageIds = await client.sMembers(`session:${sessionId}:messages`);
      const pipeline = client.multi();
      messageIds.forEach(messageId => {
        pipeline.del(`message:${messageId}`);
      });
      pipeline.del(`session:${sessionId}:messages`);
      pipeline.del(`session:${sessionId}`);
      pipeline.sRem(`user:${session.userId}:sessions`, sessionId);
      
      // If this was the current session, clear it
      const currentSession = await client.get(`user:${session.userId}:current_session`);
      if (currentSession === sessionId) {
        pipeline.del(`user:${session.userId}:current_session`);
      }
      
      await pipeline.exec();
    }
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return this.withFallback(
      async () => {
        const messageIds = await client.sMembers(`session:${sessionId}:messages`);
        
        if (messageIds.length === 0) return [];
        
        const pipeline = client.multi();
        messageIds.forEach(messageId => {
          pipeline.get(`message:${messageId}`);
        });
        
        const results = await pipeline.exec();
        const messages: Message[] = results
          ?.map(result => {
            if (!result) return null;
            const parsed = JSON.parse(String(result));
            // Convert string dates back to Date objects
            if (parsed.createdAt) {
              parsed.createdAt = new Date(parsed.createdAt);
            }
            return parsed;
          })
          .filter(Boolean)
          .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)) || [];
        
        return messages;
      },
      () => {
        const messagesJson = this.fallbackStorage.get(`session:${sessionId}:messages`) || '[]';
        const messages: Message[] = JSON.parse(messagesJson);
        // Ensure dates are Date objects
        messages.forEach(msg => {
          if (msg.createdAt && typeof msg.createdAt === 'string') {
            msg.createdAt = new Date(msg.createdAt);
          }
        });
        return messages.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
      }
    );
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
    
    return this.withFallback(
      async () => {
        const pipeline = client.multi();
        pipeline.set(`message:${id}`, JSON.stringify(message));
        pipeline.sAdd(`session:${insertMessage.sessionId}:messages`, id);
        
        // Update session updatedAt
        const sessionJson = await client.get(`session:${insertMessage.sessionId}`);
        if (sessionJson) {
          const session: ChatSession = JSON.parse(sessionJson);
          session.updatedAt = new Date();
          pipeline.set(`session:${insertMessage.sessionId}`, JSON.stringify(session));
        }
        
        await pipeline.exec();
        return message;
      },
      () => {
        // Fallback logic
        const messagesJson = this.fallbackStorage.get(`session:${insertMessage.sessionId}:messages`) || '[]';
        const messages: Message[] = JSON.parse(messagesJson);
        messages.push(message);
        this.fallbackStorage.set(`session:${insertMessage.sessionId}:messages`, JSON.stringify(messages));
        
        // Update session
        const sessionJson = this.fallbackStorage.get(`session:${insertMessage.sessionId}`);
        if (sessionJson) {
          const session: ChatSession = JSON.parse(sessionJson);
          session.updatedAt = new Date();
          this.fallbackStorage.set(`session:${insertMessage.sessionId}`, JSON.stringify(session));
        }
        
        return message;
      }
    );
  }
}

export const storage = new RedisStorage();
