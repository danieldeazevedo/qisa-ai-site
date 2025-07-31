import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateResponse, generateImage } from "./services/gemini";
import { insertUserSchema, insertMessageSchema, loginUserSchema } from "@shared/schema";
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
      res.json(session);
    } catch (error) {
      console.error("Error getting current session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for session
  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getMessagesBySession(sessionId);
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
        try {
          imageUrl = await generateImage(content);
          response = "Aqui está a imagem que você solicitou:";
        } catch (error) {
          response = "Desculpe, não consegui gerar a imagem. Tente novamente com uma descrição diferente.";
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

  // Get chat history for authenticated users
  app.get("/api/chat/history/:sessionId", async (req, res) => {
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

  // Clear chat history for authenticated users
  app.delete("/api/chat/history/:sessionId", async (req, res) => {
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

  // Delete chat session
  app.delete("/api/chat/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteChatSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
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
