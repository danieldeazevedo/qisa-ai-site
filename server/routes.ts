import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateResponse, generateImage } from "./services/gemini";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth sync endpoint
  app.post("/api/auth/sync", async (req, res) => {
    try {
      console.log('Auth sync request:', req.body);
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseId(userData.firebaseId);
      
      if (!user) {
        // Create new user
        user = await storage.createUser(userData);
        console.log('Created new user:', user.id, user.firebaseId);
      } else {
        console.log('User already exists:', user.id, user.firebaseId);
      }
      
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current chat session
  app.get("/api/chat/current-session", async (req, res) => {
    try {
      // Check if user is authenticated via Firebase
      const authHeader = req.headers.authorization;
      let firebaseId = "anonymous-user"; // Default for unauthenticated users
      let email = "anonimo@qisa.ai";
      let displayName = "Usuário Anônimo";
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // For now, just create a consistent ID for authenticated users
        // In production, this would decode and verify the Firebase JWT token
        firebaseId = "authenticated-firebase-user";
        email = "usuario.autenticado@qisa.ai";
        displayName = "Usuário Autenticado";
        console.log('Authenticated user accessing chat with token');
      } else {
        console.log('Anonymous user accessing chat');
      }
      
      // Ensure user exists in storage
      let user = await storage.getUserByFirebaseId(firebaseId);
      if (!user) {
        user = await storage.createUser({
          firebaseId,
          email,
          displayName,
          photoURL: null,
        });
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
