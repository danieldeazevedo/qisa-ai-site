import { type User, type InsertUser, type ChatSession, type InsertChatSession, type Message, type InsertMessage } from "@shared/schema";
import { client, connectRedis } from "./db";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserForAuth(username: string): Promise<(User & { passwordHash: string }) | undefined>;
  createUser(user: InsertUser & { passwordHash: string }): Promise<User>;
  
  // Chat session methods
  getCurrentSession(userId: string): Promise<ChatSession>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  deleteChatSession(sessionId: string): Promise<void>;
  
  // Message methods
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  saveMessageToHistory(userId: string, sessionId: string, message: InsertMessage): Promise<Message>;
  getChatHistory(userId: string, sessionId: string): Promise<Message[]>;
  clearChatHistory(userId: string, sessionId: string): Promise<void>;
}



export class RedisStorage implements IStorage {
  public fallbackStorage: Map<string, any> = new Map();

  constructor() {
    console.log('🚀 Storage initialized with Redis fallback support');
    console.log('🔗 Redis URL configured:', process.env.REDIS_URL ? 'Yes' : 'No');
  }

  public async withFallback<T>(redisOperation: () => Promise<T>, fallbackOperation: () => T | Promise<T>): Promise<T> {
    if (!client) {
      return await Promise.resolve(fallbackOperation());
    }
    
    try {
      return await redisOperation();
    } catch (error) {
      // Use fallback silently
      return await Promise.resolve(fallbackOperation());
    }
  }



  async getUser(id: string): Promise<User | undefined> {
    return this.withFallback(
      async () => {
        const userJson = await client!.get(`user:${id}`);
        return userJson ? JSON.parse(userJson as string) : undefined;
      },
      () => {
        const userJson = this.fallbackStorage.get(`user:${id}`);
        return userJson ? JSON.parse(userJson) : undefined;
      }
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!client) {
      // Fallback mode only
      const userId = this.fallbackStorage.get(`username:${username}`);
      if (!userId) return undefined;
      
      const userJson = this.fallbackStorage.get(`user:${userId}`);
      if (!userJson) return undefined;
      
      const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
      return userData;
    }

    try {
      // Try Redis first
      const userId = await client.get(`username:${username}`);
      if (!userId) return undefined;
      
      const userJson = await client.get(`user:${userId}`);
      if (!userJson) return undefined;
      
      // Redis Upstash returns parsed JSON objects, not strings
      const userData = userJson as any;
      return userData;
    } catch (error) {
      console.error('Redis error in getUserByUsername, falling back:', error);
      // If Redis fails, use fallback
      const userId = this.fallbackStorage.get(`username:${username}`);
      if (!userId) return undefined;
      
      const userJson = this.fallbackStorage.get(`user:${userId}`);
      if (!userJson) return undefined;
      
      const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
      return userData;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.withFallback(
      async () => {
        const userId = await client!.get(`email:${email}`);
        return userId ? this.getUser(userId as string) : undefined;
      },
      async () => {
        const userId = this.fallbackStorage.get(`email:${email}`);
        return userId ? await this.getUser(userId) : undefined;
      }
    );
  }

  async getUserForAuth(username: string): Promise<(User & { passwordHash: string }) | undefined> {
    if (!client) {
      // Fallback mode only
      console.log('Looking for user in fallback storage:', username);
      const userId = this.fallbackStorage.get(`username:${username}`);
      console.log('Found userId in fallback:', userId);
      
      if (!userId) return undefined;
      
      const userJson = this.fallbackStorage.get(`user:${userId}`);
      console.log('Found userJson in fallback:', userJson);
      
      if (!userJson) return undefined;
      
      const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
      console.log('Parsed userData from fallback:', { ...userData, passwordHash: userData.passwordHash ? '[PRESENT]' : '[MISSING]' });
      
      return userData.passwordHash ? userData : undefined;
    }

    try {
      // Try Redis first
      console.log('Looking for user in Redis:', username);
      const userId = await client.get(`username:${username}`);
      console.log('Found userId:', userId);
      
      if (!userId) return undefined;
      
      const userJson = await client.get(`user:${userId}`);
      console.log('Found userJson:', userJson);
      
      if (!userJson) return undefined;
      
      // Redis Upstash returns parsed JSON objects, not strings
      const userData = userJson as any;
      console.log('Parsed userData:', { ...userData, passwordHash: userData.passwordHash ? '[PRESENT]' : '[MISSING]' });
      
      return userData.passwordHash ? userData : undefined;
    } catch (error) {
      console.error('Redis error in getUserForAuth, falling back:', error);
      // If Redis fails, use fallback
      const userId = this.fallbackStorage.get(`username:${username}`);
      if (!userId) return undefined;
      
      const userJson = this.fallbackStorage.get(`user:${userId}`);
      if (!userJson) return undefined;
      
      const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
      return userData.passwordHash ? userData : undefined;
    }
  }

  async createUser(insertUser: InsertUser & { passwordHash: string }): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      createdAt: new Date(),
    };
    
    return this.withFallback(
      async () => {
        await client!.set(`user:${id}`, JSON.stringify({...user, passwordHash: insertUser.passwordHash}));
        await client!.set(`username:${insertUser.username}`, id);
        await client!.set(`email:${insertUser.email}`, id);
        return user;
      },
      () => {
        this.fallbackStorage.set(`user:${id}`, JSON.stringify({...user, passwordHash: insertUser.passwordHash}));
        this.fallbackStorage.set(`username:${insertUser.username}`, id);
        this.fallbackStorage.set(`email:${insertUser.email}`, id);
        return user;
      }
    );
  }

  async getCurrentSession(userId: string): Promise<ChatSession> {
    return this.withFallback(
      async () => {
        // Get user's current session
        const sessionId = await client!.get(`user:${userId}:current_session`);
        
        if (sessionId) {
          const sessionJson = await client!.get(`session:${sessionId}`);
          if (sessionJson) {
            return JSON.parse(sessionJson as string);
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
        
        await client!.set(`session:${newSessionId}`, JSON.stringify(session));
        await client!.set(`user:${userId}:current_session`, newSessionId);
        await client!.sadd(`user:${userId}:sessions`, newSessionId);
        
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
    const id = randomUUID();
    const now = new Date();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    return this.withFallback(
      async () => {
        await client!.set(`session:${id}`, JSON.stringify(session));
        await client!.sadd(`user:${insertSession.userId}:sessions`, id);
        return session;
      },
      () => {
        this.fallbackStorage.set(`session:${id}`, JSON.stringify(session));
        return session;
      }
    );
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    return this.withFallback(
      async () => {
        // Get session to find userId
        const sessionJson = await client!.get(`session:${sessionId}`);
        if (sessionJson) {
          const session: ChatSession = JSON.parse(sessionJson as string);
          
          // For Upstash, we need to delete items individually
          const messageIds = await client!.smembers(`session:${sessionId}:messages`);
          for (const messageId of messageIds) {
            await client!.del(`message:${messageId}`);
          }
          
          await client!.del(`session:${sessionId}:messages`);
          await client!.del(`session:${sessionId}`);
          await client!.srem(`user:${session.userId}:sessions`, sessionId);
          
          // If this was the current session, clear it
          const currentSession = await client!.get(`user:${session.userId}:current_session`);
          if (currentSession === sessionId) {
            await client!.del(`user:${session.userId}:current_session`);
          }
        }
      },
      () => {
        // Fallback deletion logic
        this.fallbackStorage.delete(`session:${sessionId}`);
        this.fallbackStorage.delete(`session:${sessionId}:messages`);
      }
    );
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return this.withFallback(
      async () => {
        const messageIds = await client!.smembers(`session:${sessionId}:messages`);
        
        if (messageIds.length === 0) return [];
        
        // Get messages individually for Upstash
        const messages: Message[] = [];
        for (const messageId of messageIds) {
          const messageJson = await client!.get(`message:${messageId}`);
          if (messageJson) {
            const parsed = JSON.parse(messageJson as string);
            // Convert string dates back to Date objects
            if (parsed.createdAt) {
              parsed.createdAt = new Date(parsed.createdAt);
            }
            messages.push(parsed);
          }
        }
        
        return messages.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
        
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
        await client!.set(`message:${id}`, JSON.stringify(message));
        await client!.sadd(`session:${insertMessage.sessionId}:messages`, id);
        
        // Update session updatedAt
        const sessionJson = await client!.get(`session:${insertMessage.sessionId}`);
        if (sessionJson) {
          const session: ChatSession = JSON.parse(sessionJson as string);
          session.updatedAt = new Date();
          await client!.set(`session:${insertMessage.sessionId}`, JSON.stringify(session));
        }
        
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

  async saveMessageToHistory(userId: string, sessionId: string, insertMessage: InsertMessage): Promise<Message> {
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
        // Save message to Redis with user-specific history key
        const historyKey = `user:${userId}:session:${sessionId}:history`;
        console.log(`💾 Saving message to ${historyKey}, messageId: ${id}`);
        await client!.set(`message:${id}`, JSON.stringify(message));
        await client!.lpush(historyKey, id); // Use lpush to maintain chronological order
        console.log(`✅ Message saved to Redis`);
        
        // Set expiration for anonymous users (1 hour)
        if (userId.includes('anonymous')) {
          await client!.expire(historyKey, 3600);
          await client!.expire(`message:${id}`, 3600);
        }
        
        return message;
      },
      () => {
        // Fallback logic - save to memory
        const historyKey = `user:${userId}:session:${sessionId}:history`;
        const historyJson = this.fallbackStorage.get(historyKey) || '[]';
        const history: string[] = JSON.parse(historyJson);
        history.unshift(id); // Add to beginning for chronological order
        this.fallbackStorage.set(historyKey, JSON.stringify(history));
        this.fallbackStorage.set(`message:${id}`, JSON.stringify(message));
        
        return message;
      }
    );
  }

  async getChatHistory(userId: string, sessionId: string): Promise<Message[]> {
    return this.withFallback(
      async () => {
        const historyKey = `user:${userId}:session:${sessionId}:history`;
        console.log(`🔍 Getting chat history for key: ${historyKey}`);
        const messageIds = await client!.lrange(historyKey, 0, -1); // Get all messages
        console.log(`📝 Found ${messageIds.length} message IDs:`, messageIds);
        
        if (messageIds.length === 0) return [];
        
        // Get all messages using batch operation for better performance
        const messages: Message[] = [];
        
        // Try to get all messages in parallel
        const messagePromises = messageIds.map(async (messageId) => {
          try {
            const messageJson = await client!.get(`message:${messageId}`);
            if (messageJson) {
              const parsed = typeof messageJson === 'string' ? JSON.parse(messageJson) : messageJson;
              if (parsed.createdAt) {
                parsed.createdAt = new Date(parsed.createdAt);
              }
              return parsed;
            }
            return null;
          } catch (error) {
            console.error(`❌ Error getting message ${messageId}:`, error);
            return null;
          }
        });
        
        const messageResults = await Promise.all(messagePromises);
        
        // Filter out null results and reverse to get chronological order
        const validMessages = messageResults.filter(msg => msg !== null);
        messages.push(...validMessages.reverse());
        
        console.log(`✅ Returning ${messages.length} messages`);
        return messages;
      },
      () => {
        const historyKey = `user:${userId}:session:${sessionId}:history`;
        const historyJson = this.fallbackStorage.get(historyKey) || '[]';
        const messageIds: string[] = JSON.parse(historyJson);
        
        const messages: Message[] = [];
        for (const messageId of messageIds.reverse()) { // Reverse to get chronological order
          const messageJson = this.fallbackStorage.get(`message:${messageId}`);
          if (messageJson) {
            const parsed = typeof messageJson === 'string' ? JSON.parse(messageJson) : messageJson;
            // Ensure dates are Date objects
            if (parsed.createdAt && typeof parsed.createdAt === 'string') {
              parsed.createdAt = new Date(parsed.createdAt);
            }
            messages.push(parsed);
          }
        }
        
        return messages;
      }
    );
  }

  async clearChatHistory(userId: string, sessionId: string): Promise<void> {
    return this.withFallback(
      async () => {
        const historyKey = `user:${userId}:session:${sessionId}:history`;
        const messageIds = await client!.lrange(historyKey, 0, -1);
        
        // Delete all messages
        for (const messageId of messageIds) {
          await client!.del(`message:${messageId}`);
        }
        
        // Clear the history list
        await client!.del(historyKey);
      },
      () => {
        const historyKey = `user:${userId}:session:${sessionId}:history`;
        const historyJson = this.fallbackStorage.get(historyKey) || '[]';
        const messageIds: string[] = JSON.parse(historyJson);
        
        // Delete all messages
        for (const messageId of messageIds) {
          this.fallbackStorage.delete(`message:${messageId}`);
        }
        
        // Clear the history
        this.fallbackStorage.delete(historyKey);
      }
    );
  }
}

export const storage = new RedisStorage();
