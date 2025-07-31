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
      
      // Get user by username
      const user = await storage.getUserByUsername(loginData.username);
      if (!user) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
      
      // Get user with password hash from Redis
      const userWithPasswordData = await storage.withFallback(
        async () => {
          const { client } = await import('./db');
          const fullUserJson = await client!.get(`user:${user.id}`);
          return fullUserJson ? JSON.parse(fullUserJson as string) : null;
        },
        () => {
          const fullUserJson = storage.fallbackStorage.get(`user:${user.id}`);
          return fullUserJson ? JSON.parse(fullUserJson) : null;
        }
      );
      
      if (!userWithPasswordData) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      // Verify password
      const bcrypt = await import("bcryptjs");
      const isValidPassword = await bcrypt.compare(loginData.password, userWithPasswordData.passwordHash || '');
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
      
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

  // Send message
  app.post("/api/chat/send", async (req, res) => {
    try {
      const sendMessageSchema = z.object({
        sessionId: z.string(),
        content: z.string(),
        isImageRequest: z.boolean().default(false),
      });

      const { sessionId, content, isImageRequest } = sendMessageSchema.parse(req.body);

      // Save user message
      const userMessage = await storage.createMessage({
        sessionId,
        role: "user",
        content,
        imageUrl: null,
        metadata: null,
      });

      // Get conversation context
      const messages = await storage.getMessagesBySession(sessionId);
      const context = messages
        .slice(0, -1) // Exclude the just-added user message
        .map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      let assistantResponse: string;
      let imageUrl: string | null = null;

      if (isImageRequest) {
        try {
          imageUrl = await generateImage(content);
          assistantResponse = "Aqui está a imagem que você solicitou:";
        } catch (error) {
          assistantResponse = "Desculpe, não consegui gerar a imagem. Tente novamente com uma descrição diferente.";
        }
      } else {
        assistantResponse = await generateResponse(content, context);
      }

      // Save assistant message
      const assistantMessage = await storage.createMessage({
        sessionId,
        role: "assistant",
        content: assistantResponse,
        imageUrl,
        metadata: null,
      });

      res.json({
        userMessage,
        assistantMessage,
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

  const httpServer = createServer(app);
  return httpServer;
}
