import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateResponse, generateImage } from "./services/gemini";
import { insertUserSchema, insertMessageSchema, loginUserSchema, insertChatSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log('Register request:', req.body.username);
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email já está em uso" });
      }
      
      // Hash password
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        passwordHash
      });
      
      console.log('Created new user:', user.id, userData.username);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error in register:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login request:', req.body.username);
      const loginData = loginUserSchema.parse(req.body);
      
      // Get user with password hash for authentication
      const userWithPasswordData = await storage.getUserForAuth(loginData.username);
      if (!userWithPasswordData) {
        console.log('User not found:', loginData.username);
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
      
      // Verify password
      const bcrypt = await import("bcryptjs");
      const isValidPassword = await bcrypt.compare(loginData.password, userWithPasswordData.passwordHash);
      
      if (!isValidPassword) {
        console.log('Invalid password for user:', loginData.username);
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
      
      // Remove password hash from response
      const { passwordHash, ...user } = userWithPasswordData;
      
      console.log('User logged in:', user.id, loginData.username);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // Get current chat session
  app.get("/api/chat/current-session", async (req, res) => {
    try {
      // Check for authenticated user first
      const username = req.headers['x-username'] as string;
      let user;
      
      if (username) {
        // User is authenticated
        console.log('Getting session for authenticated user:', username);
        user = await storage.getUserByUsername(username);
        
        if (!user) {
          return res.status(401).json({ error: "Usuário não encontrado" });
        }
      } else {
        // Anonymous user - generate browser session ID
        const sessionUserId = req.headers['x-user-session'] as string || 
                             req.headers['user-agent']?.slice(0, 20) + '-' + Date.now();
        
        const anonymousUsername = `anonymous-${sessionUserId}`;
        console.log('Getting session for anonymous user:', anonymousUsername);
        
        user = await storage.getUserByUsername(anonymousUsername);
        if (!user) {
          user = await storage.createUser({
            username: anonymousUsername,
            email: "anonimo@qisa.ai",
            password: "anonymous", // Not used for anonymous users
            displayName: "Usuário Anônimo",
            photoURL: null,
            passwordHash: "anonymous" // Not used for anonymous users
          });
          console.log('Created anonymous user:', anonymousUsername);
        }
      }
      
      const session = await storage.getCurrentSession(user.id);
      res.json(session || null);
    } catch (error) {
      console.error("Error getting current session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for session
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const username = req.headers['x-username'] as string;

      if (!username || username.includes('anonymous')) {
        // Anonymous users don't have persistent history
        return res.json([]);
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const messages = await storage.getChatHistory(user.id, sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send message with full history persistence
  app.post("/api/chat/send", async (req, res) => {
    try {
      const sendMessageSchema = z.object({
        content: z.string(),
        isImageRequest: z.boolean().default(false),
        sessionId: z.string(),
      });

      const { content, isImageRequest, sessionId } = sendMessageSchema.parse(req.body);

      // Get username from headers
      const username = req.headers['x-username'] as string;
      let user;
      let userId;
      let shouldSaveHistory = false;

      if (username && !username.includes('anonymous')) {
        // Authenticated user - save history
        user = await storage.getUserByUsername(username);
        if (!user) {
          return res.status(401).json({ error: "Usuário não encontrado" });
        }
        userId = user.id;
        shouldSaveHistory = true;
      } else {
        // Anonymous user - don't save history, just use session
        const sessionUserId = req.headers['x-user-session'] as string || 
                             req.headers['user-agent']?.slice(0, 20) + '-' + Date.now();
        
        const anonymousUsername = `anonymous-${sessionUserId}`;
        user = await storage.getUserByUsername(anonymousUsername);
        if (!user) {
          user = await storage.createUser({
            username: anonymousUsername,
            email: "anonimo@qisa.ai",
            password: "anonymous",
            displayName: "Usuário Anônimo", 
            photoURL: null,
            passwordHash: "anonymous"
          });
        }
        userId = user.id;
        shouldSaveHistory = false; // Don't save for anonymous users
      }

      // Save user message first if authenticated
      if (shouldSaveHistory) {
        await storage.saveMessageToHistory(userId, sessionId, {
          sessionId,
          role: "user",
          content,
          imageUrl: null,
          metadata: null
        });
      }

      // Get chat history for context (including the message we just saved)
      let context: any[] = [];
      if (shouldSaveHistory) {
        console.log(`🔍 Getting context for userId: ${userId}, sessionId: ${sessionId}`);
        const history = await storage.getChatHistory(userId, sessionId);
        console.log(`📚 Retrieved ${history.length} messages from history`);
        context = history.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        console.log(`📖 Context for AI:`, context);
      }

      let response: string;
      let imageUrl: string | null = null;

      if (isImageRequest) {
        // Check if user has enough QKoins for image generation
        if (username && !username.includes('anonymous')) {
          const userQkoins = await storage.getUserQkoins(userId);
          if (userQkoins < 1) {
            response = "❌ QKoins insuficientes! Você precisa de 1 QKoin para gerar uma imagem. Colete sua recompensa diária ou aguarde até amanhã.";
          } else {
            try {
              // Spend 1 QKoin for image generation
              const spent = await storage.spendQkoins(userId, 1, `Geração de imagem: ${content.substring(0, 50)}...`);
              if (spent) {
                imageUrl = await generateImage(content);
                response = "Aqui está a imagem que você solicitou:";
              } else {
                response = "❌ Erro ao processar QKoins. Tente novamente.";
              }
            } catch (error) {
              // Refund the QKoin if image generation fails
              await storage.addQkoins(userId, 1, 'earned', 'Reembolso: falha na geração de imagem');
              response = "Desculpe, não consegui gerar a imagem. Tente novamente com uma descrição diferente. Seu QKoin foi reembolsado.";
            }
          }
        } else {
          response = "❌ Para gerar imagens, você precisa fazer login e ter QKoins. Faça login e colete sua recompensa diária!";
        }
      } else {
        // Pass username to AI for personalization
        const actualUsername = username && !username.includes('anonymous') ? user.username : undefined;
        response = await generateResponse(content, context, actualUsername);
      }

      // Save AI response if authenticated
      if (shouldSaveHistory) {
        await storage.saveMessageToHistory(userId, sessionId, {
          sessionId,
          role: "assistant",
          content: response,
          imageUrl,
          metadata: null
        });
      }

      res.json({
        response,
        imageUrl,
        saved: shouldSaveHistory
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get chat messages for a specific session
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const username = req.headers['x-username'] as string;

      if (!username || username.includes('anonymous')) {
        // Anonymous users don't have history
        return res.json([]);
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const history = await storage.getChatHistory(user.id, sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clear chat messages for a specific session
  app.delete("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const username = req.headers['x-username'] as string;

      if (!username || username.includes('anonymous')) {
        return res.json({ success: true, message: "Não há histórico para limpar" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      await storage.clearChatHistory(user.id, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Simple send message without persistence (fallback for anonymous users)
  app.post("/api/chat/simple-send", async (req, res) => {
    try {
      const sendMessageSchema = z.object({
        content: z.string(),
        isImageRequest: z.boolean().default(false),
        context: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).default([]),
      });

      const { content, isImageRequest, context } = sendMessageSchema.parse(req.body);

      let response: string;
      let imageUrl: string | null = null;

      if (isImageRequest) {
        try {
          imageUrl = await generateImage(content);
          response = "Aqui está a imagem que você solicitou:";
        } catch (error) {
          response = "Desculpe, não consegui gerar a imagem. Tente novamente com uma descrição diferente.";
        }
      } else {
        // Don't pass username for anonymous users
        response = await generateResponse(content, context);
      }

      res.json({
        response,
        imageUrl,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's chat sessions
  app.get("/api/chat/sessions", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      console.log('Getting session for authenticated user:', username);
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para acessar múltiplas sessões" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      console.log('Found user for sessions:', user.id);
      const sessions = await storage.getUserSessions(user.id);
      console.log('Retrieved sessions:', sessions);
      res.json(sessions);
    } catch (error) {
      console.error("Error getting user sessions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new chat session
  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para criar novas sessões" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      const sessionData = insertChatSessionSchema.parse({
        userId: user.id,
        title: req.body.title || "Nova Conversa"
      });
      
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update chat session (e.g., rename)
  app.patch("/api/chat/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para atualizar sessões" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      const updates = {
        title: req.body.title
      };
      
      const session = await storage.updateChatSession(sessionId, updates);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Set current session
  app.post("/api/chat/sessions/:sessionId/activate", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para alternar sessões" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      await storage.setCurrentSession(user.id, sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting current session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete chat session
  app.delete("/api/chat/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const username = req.headers['x-username'] as string;
      
      console.log(`🗑️ Delete request for session: ${sessionId} by user: ${username}`);
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para deletar sessões" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      console.log(`🔍 Deleting session ${sessionId} for user ${user.id}`);
      await storage.deleteChatSession(sessionId);
      console.log(`✅ Session ${sessionId} deleted successfully`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Routes (only for daniel08)
  
  // Middleware to check admin access
  const checkAdmin = (req: any, res: any, next: any) => {
    const username = req.headers['x-username'] as string;
    if (username !== 'daniel08') {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    }
    next();
  };

  // Get all users for admin
  app.get("/api/admin/users", checkAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      const adminUsers = await Promise.all(users.map(async (user: any) => {
        const qkoins = await storage.getUserQkoins(user.id);
        const messageCount = await storage.getUserMessageCount(user.id);
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          qkoins,
          messageCount,
          lastLogin: user.lastLogin || new Date().toISOString(),
          banned: user.banned || false,
        };
      }));

      res.json(adminUsers);
    } catch (error) {
      console.error("Error getting admin users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get system status
  app.get("/api/admin/status", checkAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalMessages = await storage.getTotalMessageCount();
      
      res.json({
        online: true,
        uptime: process.uptime() + " seconds",
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => !u.username?.includes('anonymous')).length,
        totalMessages,
        systemLoad: Math.random() * 100, // Simulated system load
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get system logs
  app.get("/api/admin/logs", checkAdmin, async (req, res) => {
    try {
      const logs = await storage.getSystemLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error getting logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", checkAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      await storage.deleteUser(userId);
      await storage.addSystemLog('info', `Admin deleted user ${userId}`, `Deleted by daniel08`);
      
      res.json({ success: true, message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ban/Unban user
  app.patch("/api/admin/users/:userId/ban", checkAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { banned } = req.body;
      
      await storage.updateUserBanStatus(userId, banned);
      await storage.addSystemLog('info', `Admin ${banned ? 'banned' : 'unbanned'} user ${userId}`, `Action by daniel08`);
      
      res.json({ success: true, message: banned ? "Usuário banido" : "Usuário desbanido" });
    } catch (error) {
      console.error("Error updating user ban status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clear user chat history
  app.delete("/api/admin/users/:userId/history", checkAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      await storage.clearUserChatHistory(userId);
      await storage.addSystemLog('info', `Admin cleared chat history for user ${userId}`, `Action by daniel08`);
      
      res.json({ success: true, message: "Histórico do usuário limpo" });
    } catch (error) {
      console.error("Error clearing user history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Toggle system online/offline
  app.patch("/api/admin/system/toggle", checkAdmin, async (req, res) => {
    try {
      const { online } = req.body;
      
      await storage.setSystemStatus(online);
      await storage.addSystemLog('info', `System ${online ? 'enabled' : 'disabled'}`, `Action by daniel08`);
      
      res.json({ success: true, message: online ? "Sistema ativado" : "Sistema desativado" });
    } catch (error) {
      console.error("Error toggling system status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clear all logs
  app.delete("/api/admin/logs", checkAdmin, async (req, res) => {
    try {
      await storage.clearSystemLogs();
      await storage.addSystemLog('info', 'All system logs cleared', 'Action by daniel08');
      
      res.json({ success: true, message: "Logs limpos com sucesso" });
    } catch (error) {
      console.error("Error clearing logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // QKoin Routes
  
  // Get user QKoins balance
  app.get("/api/qkoins/balance", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.json({ qkoins: 0, message: "Login necessário para usar QKoins" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const qkoins = await storage.getUserQkoins(user.id);
      const canClaimDaily = await storage.checkDailyReward(user.id);
      const canClaimBonus = await storage.canClaimBonus(user.id);
      
      res.json({ 
        qkoins, 
        canClaimDaily,
        canClaimBonus,
        userId: user.id 
      });
    } catch (error) {
      console.error("Error getting QKoins balance:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Claim daily reward
  app.post("/api/qkoins/daily-reward", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para receber recompensas" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const claimed = await storage.claimDailyReward(user.id);
      
      if (claimed) {
        const newBalance = await storage.getUserQkoins(user.id);
        res.json({ 
          success: true, 
          message: "Recompensa diária coletada! +10 QKoins",
          qkoins: newBalance
        });
      } else {
        res.status(400).json({ error: "Recompensa diária já foi coletada hoje" });
      }
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get QKoin transactions
  app.get("/api/qkoins/transactions", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.json([]);
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const transactions = await storage.getQkoinTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting QKoin transactions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add bonus QKoins (reward button)
  app.post("/api/qkoins/claim-bonus", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário para receber bônus" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      // Check if user can claim bonus (4 hour cooldown)
      const now = new Date();
      if (user.lastBonusClaim) {
        const timeSinceLastBonus = now.getTime() - new Date(user.lastBonusClaim).getTime();
        const fourHoursInMs = 4 * 60 * 60 * 1000; // 4 hours
        
        if (timeSinceLastBonus < fourHoursInMs) {
          const remainingTime = Math.ceil((fourHoursInMs - timeSinceLastBonus) / (60 * 1000)); // minutes
          return res.status(400).json({ 
            error: `Aguarde ${remainingTime} minutos para resgatar outro bônus` 
          });
        }
      }

      // Add 5 bonus QKoins and update last bonus claim time
      await storage.addQkoins(user.id, 5, 'earned', 'Bônus resgatado pelo usuário');
      await storage.updateUserBonusClaim(user.id, now);
      const newBalance = await storage.getUserQkoins(user.id);
      
      res.json({ 
        success: true, 
        message: "Bônus resgatado! +5 QKoins",
        qkoins: newBalance
      });
    } catch (error) {
      console.error("Error claiming bonus QKoins:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
