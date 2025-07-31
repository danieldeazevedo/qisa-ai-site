import { type User, type InsertUser, type ChatSession, type InsertChatSession, type Message, type InsertMessage, type QkoinTransaction, type InsertQkoinTransaction } from "@shared/schema";
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
  
  // QKoin methods
  getUserQkoins(userId: string): Promise<number>;
  addQkoins(userId: string, amount: number, type: 'earned' | 'spent' | 'daily_reward', description: string): Promise<void>;
  spendQkoins(userId: string, amount: number, description: string): Promise<boolean>;
  checkDailyReward(userId: string): Promise<boolean>;
  claimDailyReward(userId: string): Promise<boolean>;
  getQkoinTransactions(userId: string): Promise<QkoinTransaction[]>;
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
      qkoins: 10, // Usuários começam com 10 QKoins
      lastDailyReward: null,
      lastBonusClaim: null,
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

  // QKoin Methods
  async getUserQkoins(userId: string): Promise<number> {
    return this.withFallback(
      async () => {
        const qkoins = await client!.get(`user:${userId}:qkoins`);
        return qkoins ? parseInt(qkoins as string) : 0;
      },
      () => {
        const qkoins = this.fallbackStorage.get(`user:${userId}:qkoins`);
        return qkoins ? parseInt(qkoins) : 0;
      }
    );
  }

  async addQkoins(userId: string, amount: number, type: 'earned' | 'spent' | 'daily_reward', description: string): Promise<void> {
    return this.withFallback(
      async () => {
        // Get current qkoins
        const currentQkoins = await this.getUserQkoins(userId);
        const newQkoins = currentQkoins + amount;
        
        // Update user qkoins
        await client!.set(`user:${userId}:qkoins`, newQkoins.toString());
        
        // Update user object
        const userJson = await client!.get(`user:${userId}`);
        if (userJson) {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          userData.qkoins = newQkoins;
          await client!.set(`user:${userId}`, JSON.stringify(userData));
        }
        
        // Log transaction
        const transactionId = randomUUID();
        const transaction: QkoinTransaction = {
          id: transactionId,
          userId,
          amount,
          type,
          description,
          createdAt: new Date(),
        };
        
        await client!.set(`transaction:${transactionId}`, JSON.stringify(transaction));
        await client!.lpush(`user:${userId}:transactions`, transactionId);
      },
      async () => {
        // Fallback logic
        const currentQkoins = await this.getUserQkoins(userId);
        const newQkoins = (currentQkoins || 0) + amount;
        
        this.fallbackStorage.set(`user:${userId}:qkoins`, newQkoins.toString());
        
        // Update user object
        const userJson = this.fallbackStorage.get(`user:${userId}`);
        if (userJson) {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          userData.qkoins = newQkoins;
          this.fallbackStorage.set(`user:${userId}`, JSON.stringify(userData));
        }
        
        // Log transaction
        const transactionId = randomUUID();
        const transaction: QkoinTransaction = {
          id: transactionId,
          userId,
          amount,
          type,
          description,
          createdAt: new Date(),
        };
        
        this.fallbackStorage.set(`transaction:${transactionId}`, JSON.stringify(transaction));
        
        const transactionsJson = this.fallbackStorage.get(`user:${userId}:transactions`) || '[]';
        const transactions: string[] = JSON.parse(transactionsJson);
        transactions.unshift(transactionId);
        this.fallbackStorage.set(`user:${userId}:transactions`, JSON.stringify(transactions));
      }
    );
  }

  async spendQkoins(userId: string, amount: number, description: string): Promise<boolean> {
    const currentQkoins = await this.getUserQkoins(userId);
    
    if (currentQkoins < amount) {
      return false; // Insufficient funds
    }
    
    await this.addQkoins(userId, -amount, 'spent', description);
    return true;
  }

  async checkDailyReward(userId: string): Promise<boolean> {
    return this.withFallback(
      async () => {
        const lastRewardTimestamp = await client!.get(`user:${userId}:lastDailyReward`);
        if (!lastRewardTimestamp) return true; // Never claimed
        
        const lastRewardTime = parseInt(lastRewardTimestamp as string);
        const now = Date.now();
        const hoursDiff = (now - lastRewardTime) / (1000 * 60 * 60);
        
        return hoursDiff >= 24;
      },
      () => {
        const lastRewardTimestamp = this.fallbackStorage.get(`user:${userId}:lastDailyReward`);
        if (!lastRewardTimestamp) return true; // Never claimed
        
        const lastRewardTime = parseInt(lastRewardTimestamp);
        const now = Date.now();
        const hoursDiff = (now - lastRewardTime) / (1000 * 60 * 60);
        
        return hoursDiff >= 24;
      }
    );
  }

  async claimDailyReward(userId: string): Promise<boolean> {
    const canClaim = await this.checkDailyReward(userId);
    
    if (!canClaim) return false;
    
    return this.withFallback(
      async () => {
        // Add 10 QKoins daily reward
        await this.addQkoins(userId, 10, 'daily_reward', 'Recompensa diária');
        
        // Update lastDailyReward with timestamp
        const now = Date.now();
        await client!.set(`user:${userId}:lastDailyReward`, now.toString());
        
        return true;
      },
      async () => {
        // Add 10 QKoins to fallback storage
        await this.addQkoins(userId, 10, 'daily_reward', 'Recompensa diária');
        
        // Update lastDailyReward with timestamp
        const now = Date.now();
        this.fallbackStorage.set(`user:${userId}:lastDailyReward`, now.toString());
        
        return true;
      }
    );
  }

  async getQkoinTransactions(userId: string): Promise<QkoinTransaction[]> {
    return this.withFallback(
      async () => {
        const transactionIds = await client!.lrange(`user:${userId}:transactions`, 0, 49); // Last 50 transactions
        
        const transactions: QkoinTransaction[] = [];
        for (const transactionId of transactionIds) {
          const transactionJson = await client!.get(`transaction:${transactionId}`);
          if (transactionJson) {
            const parsed = typeof transactionJson === 'string' ? JSON.parse(transactionJson) : transactionJson;
            if (parsed.createdAt) {
              parsed.createdAt = new Date(parsed.createdAt);
            }
            transactions.push(parsed);
          }
        }
        
        return transactions;
      },
      () => {
        const transactionsJson = this.fallbackStorage.get(`user:${userId}:transactions`) || '[]';
        const transactionIds: string[] = JSON.parse(transactionsJson);
        
        const transactions: QkoinTransaction[] = [];
        for (const transactionId of transactionIds.slice(0, 50)) { // Last 50 transactions
          const transactionJson = this.fallbackStorage.get(`transaction:${transactionId}`);
          if (transactionJson) {
            const parsed = typeof transactionJson === 'string' ? JSON.parse(transactionJson) : transactionJson;
            if (parsed.createdAt && typeof parsed.createdAt === 'string') {
              parsed.createdAt = new Date(parsed.createdAt);
            }
            transactions.push(parsed);
          }
        }
        
        return transactions;
      }
    );
  }

  async canClaimBonus(userId: string): Promise<boolean> {
    return this.withFallback(
      async () => {
        const user = await this.getUser(userId);
        if (!user || !user.lastBonusClaim) return true;
        
        const now = new Date();
        const timeSinceLastBonus = now.getTime() - new Date(user.lastBonusClaim).getTime();
        const fourHoursInMs = 4 * 60 * 60 * 1000; // 4 hours
        
        return timeSinceLastBonus >= fourHoursInMs;
      },
      () => {
        const lastBonusClaimTs = this.fallbackStorage.get(`user:${userId}:lastBonusClaim`);
        if (!lastBonusClaimTs) return true;
        
        const now = Date.now();
        const timeSinceLastBonus = now - parseInt(lastBonusClaimTs);
        const fourHoursInMs = 4 * 60 * 60 * 1000; // 4 hours
        
        return timeSinceLastBonus >= fourHoursInMs;
      }
    );
  }

  async updateUserBonusClaim(userId: string, timestamp: Date): Promise<void> {
    return this.withFallback(
      async () => {
        // Update user object in Redis
        const userJson = await client!.get(`user:${userId}`);
        if (userJson) {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          userData.lastBonusClaim = timestamp;
          await client!.set(`user:${userId}`, JSON.stringify(userData));
        }
      },
      () => {
        // Update user object in fallback storage
        const userJson = this.fallbackStorage.get(`user:${userId}`);
        if (userJson) {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          userData.lastBonusClaim = timestamp;
          this.fallbackStorage.set(`user:${userId}`, JSON.stringify(userData));
        }
        
        // Also store timestamp separately for easy access
        this.fallbackStorage.set(`user:${userId}:lastBonusClaim`, timestamp.getTime().toString());
      }
    );
  }

  // Admin methods
  async getAllUsers(): Promise<any[]> {
    return this.withFallback(
      async () => {
        const keys = await client!.keys('user:*');
        const users = [];
        
        for (const key of keys) {
          if (!key.includes(':') || key.split(':').length !== 2) continue; // Skip non-user keys
          const userJson = await client!.get(key);
          if (userJson) {
            const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
            users.push(userData);
          }
        }
        
        return users;
      },
      () => {
        const users = [];
        for (const [key, value] of this.fallbackStorage.entries()) {
          if (key.startsWith('user:') && !key.includes(':', 5)) { // user:id format only
            const userData = typeof value === 'string' ? JSON.parse(value) : value;
            users.push(userData);
          }
        }
        return users;
      }
    );
  }

  async getUserMessageCount(userId: string): Promise<number> {
    return this.withFallback(
      async () => {
        const messageKey = `user:${userId}:session:main:history`;
        const messageIds = await client!.lrange(messageKey, 0, -1);
        return messageIds.length;
      },
      () => {
        // Count messages in fallback storage
        let count = 0;
        for (const key of this.fallbackStorage.keys()) {
          if (key.startsWith(`user:${userId}:message:`)) {
            count++;
          }
        }
        return count;
      }
    );
  }

  async getTotalMessageCount(): Promise<number> {
    return this.withFallback(
      async () => {
        const keys = await client!.keys('user:*:session:*:history');
        let total = 0;
        
        for (const key of keys) {
          const messageIds = await client!.lrange(key, 0, -1);
          total += messageIds.length;
        }
        
        return total;
      },
      () => {
        let count = 0;
        for (const key of this.fallbackStorage.keys()) {
          if (key.includes(':message:')) {
            count++;
          }
        }
        return count;
      }
    );
  }

  async getSystemLogs(): Promise<any[]> {
    return this.withFallback(
      async () => {
        const logsJson = await client!.get('system:logs');
        return logsJson ? JSON.parse(logsJson) : [];
      },
      () => {
        const logsJson = this.fallbackStorage.get('system:logs');
        return logsJson ? JSON.parse(logsJson) : [];
      }
    );
  }

  async addSystemLog(level: string, message: string, details?: string): Promise<void> {
    return this.withFallback(
      async () => {
        const logs = await this.getSystemLogs();
        const newLog = {
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          level,
          message,
          details
        };
        
        logs.unshift(newLog);
        // Keep only last 1000 logs
        if (logs.length > 1000) logs.splice(1000);
        
        await client!.set('system:logs', JSON.stringify(logs));
      },
      () => {
        const logs = this.getSystemLogs();
        const newLog = {
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          level,
          message,
          details
        };
        
        logs.unshift(newLog);
        // Keep only last 1000 logs
        if (logs.length > 1000) logs.splice(1000);
        
        this.fallbackStorage.set('system:logs', JSON.stringify(logs));
      }
    );
  }

  async deleteUser(userId: string): Promise<void> {
    return this.withFallback(
      async () => {
        // Delete user data
        await client!.del(`user:${userId}`);
        
        // Delete user sessions and messages
        const sessionKeys = await client!.keys(`user:${userId}:*`);
        if (sessionKeys.length > 0) {
          await client!.del(...sessionKeys);
        }
        
        // Delete QKoins data
        await client!.del(`user:${userId}:qkoins`);
        await client!.del(`user:${userId}:transactions`);
        await client!.del(`user:${userId}:lastReward`);
        await client!.del(`user:${userId}:lastBonusClaim`);
      },
      () => {
        // Delete from fallback storage
        const keysToDelete = [];
        for (const key of this.fallbackStorage.keys()) {
          if (key.startsWith(`user:${userId}`)) {
            keysToDelete.push(key);
          }
        }
        
        keysToDelete.forEach(key => this.fallbackStorage.delete(key));
      }
    );
  }

  async updateUserBanStatus(userId: string, banned: boolean): Promise<void> {
    return this.withFallback(
      async () => {
        const userJson = await client!.get(`user:${userId}`);
        if (userJson) {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          userData.banned = banned;
          await client!.set(`user:${userId}`, JSON.stringify(userData));
        }
      },
      () => {
        const userJson = this.fallbackStorage.get(`user:${userId}`);
        if (userJson) {
          const userData = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
          userData.banned = banned;
          this.fallbackStorage.set(`user:${userId}`, JSON.stringify(userData));
        }
      }
    );
  }

  async clearUserChatHistory(userId: string): Promise<void> {
    return this.withFallback(
      async () => {
        const sessionKeys = await client!.keys(`user:${userId}:session:*`);
        if (sessionKeys.length > 0) {
          await client!.del(...sessionKeys);
        }
      },
      () => {
        const keysToDelete = [];
        for (const key of this.fallbackStorage.keys()) {
          if (key.startsWith(`user:${userId}:session:`) || key.startsWith(`user:${userId}:message:`)) {
            keysToDelete.push(key);
          }
        }
        
        keysToDelete.forEach(key => this.fallbackStorage.delete(key));
      }
    );
  }

  async setSystemStatus(online: boolean): Promise<void> {
    return this.withFallback(
      async () => {
        await client!.set('system:status', JSON.stringify({ online, updatedAt: new Date().toISOString() }));
      },
      () => {
        this.fallbackStorage.set('system:status', JSON.stringify({ online, updatedAt: new Date().toISOString() }));
      }
    );
  }

  async clearSystemLogs(): Promise<void> {
    return this.withFallback(
      async () => {
        await client!.del('system:logs');
      },
      () => {
        this.fallbackStorage.delete('system:logs');
      }
    );
  }
}

export const storage = new RedisStorage();
