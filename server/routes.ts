import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { client } from "./db";
import { generateResponse, generateImage } from "./services/gemini";
import { fileProcessor } from "./services/file-processor";
import { insertUserSchema, insertMessageSchema, loginUserSchema, insertChatSessionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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
        attachments: z.array(z.any()).default([]),
      });

      const { content, isImageRequest, sessionId, attachments } = sendMessageSchema.parse(req.body);
      console.log('📨 Received message with attachments:', attachments?.length || 0);

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

      // Check if there are image attachments
      const imageAttachments = attachments?.filter(att => 
        att.type === 'image' && 
        att.mimeType && 
        att.mimeType.startsWith('image/') &&
        att.filePath
      ) || [];

      console.log(`📎 Processing ${attachments?.length || 0} attachments, ${imageAttachments.length} are images`);

      // Check for image editing keywords
      const editKeywords = ['editar', 'trocar', 'modificar', 'alterar', 'mudar', 'pinte', 'mude', 'troque'];
      const isEditRequest = editKeywords.some(keyword => content.toLowerCase().includes(keyword));
      
      // Check for image analysis keywords
      const analyzeKeywords = ['analisar', 'analise', 'descreva', 'descrever', 'o que', 'que tem', 'vejo', 'mostrar'];
      const isAnalyzeRequest = analyzeKeywords.some(keyword => content.toLowerCase().includes(keyword));

      if (imageAttachments.length > 0 && isEditRequest && username && !username.includes('anonymous')) {
        console.log(`🎨 Image EDIT request detected for user: ${username}`);
        console.log(`🎨 Edit keywords found in: "${content}"`);
        console.log(`🎨 Image to edit: ${imageAttachments[0].originalName}`);
        
        // Image editing request - use QKoins and return edited image
        const userQkoins = await storage.getUserQkoins(userId);
        if (userQkoins < 1) {
          response = "❌ QKoins insuficientes! Você precisa de 1 QKoin para editar uma imagem. Colete sua recompensa diária ou aguarde até amanhã.";
        } else {
          try {
            // Spend 1 QKoin for image editing
            const spent = await storage.spendQkoins(userId, 1, `Edição de imagem: ${content.substring(0, 50)}...`);
            if (spent) {
              const imageAttachment = imageAttachments[0];
              console.log(`📸 Editing image: ${imageAttachment.originalName}, MIME: ${imageAttachment.mimeType}, path: ${imageAttachment.filePath}`);
              
              if (imageAttachment.filePath && fs.existsSync(imageAttachment.filePath)) {
                const { editImage } = await import('./services/gemini');
                console.log(`🔧 Calling editImage with prompt: "${content}"`);
                imageUrl = await editImage(imageAttachment.filePath, content);
                console.log(`✅ Image edited successfully, imageUrl: ${imageUrl ? 'RECEIVED' : 'NULL'}`);
                
                if (imageUrl) {
                  response = "Aqui está sua imagem editada:";
                } else {
                  response = "❌ Não foi possível gerar a imagem editada. Seu QKoin foi reembolsado.";
                  await storage.addQkoins(userId, 1, 'earned', 'Reembolso: imagem não gerada');
                }
              } else {
                response = "❌ Arquivo de imagem não encontrado no servidor.";
                await storage.addQkoins(userId, 1, 'earned', 'Reembolso: arquivo não encontrado');
              }
            } else {
              response = "❌ Erro ao processar QKoins. Tente novamente.";
            }
          } catch (error) {
            console.error("❌ Error editing image:", error);
            // Refund the QKoin if image editing fails
            await storage.addQkoins(userId, 1, 'earned', 'Reembolso: falha na edição de imagem');
            response = "Desculpe, não consegui editar a imagem. Tente novamente com uma descrição diferente. Seu QKoin foi reembolsado.";
          }
        }
      } else if (imageAttachments.length > 0 && (isAnalyzeRequest || (!isEditRequest && !isImageRequest))) {
        console.log(`🔍 Image ANALYSIS request detected for user: ${username}`);
        console.log(`🔍 Analyze keywords found in: "${content}"`);
        
        // Image analysis - free, just text response
        try {
          const actualUsername = username && !username.includes('anonymous') ? user.username : undefined;
          response = await generateResponse(content, context, actualUsername, attachments);
          console.log(`✅ Image analysis completed`);
        } catch (error) {
          console.error("❌ Error analyzing image:", error);
          response = "Desculpe, não consegui analisar a imagem. Tente novamente.";
        }
      } else if (isImageRequest) {
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
        // Pass username to AI for personalization and include attachments
        const actualUsername = username && !username.includes('anonymous') ? user.username : undefined;
        response = await generateResponse(content, context, actualUsername, attachments);
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
      
      // Verificar se a sessão ainda existe no Redis antes de tentar atualizar
      if (client) {
        const sessionExists = await client.get(`session:${sessionId}`);
        const isInUserSet = await client.sismember(`user:${user.id}:sessions`, sessionId);
        
        console.log(`🔍 Rename check: Session ${sessionId} exists: ${!!sessionExists}, in set: ${isInUserSet}`);
        
        if (!sessionExists || !isInUserSet) {
          console.log(`❌ Rename failed: Session ${sessionId} not found in Redis`);
          return res.status(404).json({ error: "Sessão não encontrada ou foi removida" });
        }
      }
      
      const updates = {
        title: typeof req.body.title === 'string' ? req.body.title : String(req.body.title)
      };
      
      console.log(`🔍 Rename request for session ${sessionId}`);
      console.log(`🔍 Request body:`, req.body);
      console.log(`🔍 Title value:`, req.body.title);
      console.log(`🔍 Title type:`, typeof req.body.title);
      console.log(`🔍 Updates object:`, updates);
      
      // Use direct Redis update since storage layer has inconsistencies
      if (client) {
        try {
          const sessionData = await client.get(`session:${sessionId}`);
          console.log(`🔍 Raw session data:`, sessionData);
          
          if (sessionData) {
            let session;
            try {
              session = JSON.parse(sessionData as string);
            } catch (parseError) {
              console.log(`❌ JSON parse error, recreating session data`);
              // If data is corrupted, recreate minimal session object
              session = {
                id: sessionId,
                userId: user.id,
                title: "Nova Conversa",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
            
            session.title = updates.title;
            session.updatedAt = new Date().toISOString();
            
            const sessionJson = JSON.stringify(session);
            await client.set(`session:${sessionId}`, sessionJson);
            console.log(`✅ Direct Redis: Session ${sessionId} renamed to: ${updates.title}`);
            
            res.json(session);
            return;
          } else {
            console.log(`❌ Session ${sessionId} not found in Redis`);
            return res.status(404).json({ error: "Sessão não encontrada ou foi removida" });
          }
        } catch (redisError: any) {
          console.log(`❌ Direct Redis update failed:`, redisError.message);
          console.log(`❌ Full redis error:`, redisError);
          console.log(`❌ Redis error stack:`, redisError.stack);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }
      } else {
        // Fallback to storage if Redis not available
        try {
          const session = await storage.updateChatSession(sessionId, updates);
          console.log(`✅ Storage: Session ${sessionId} renamed successfully to: ${updates.title}`);
          res.json(session);
        } catch (updateError: any) {
          console.log(`❌ Storage update failed for session ${sessionId}:`, updateError.message);
          if (updateError.message === "Session not found") {
            return res.status(404).json({ error: "Sessão não encontrada ou foi removida" });
          }
          return res.status(500).json({ error: "Erro interno do servidor" });
        }
      }
    } catch (error: any) {
      console.error("Error updating session:", error);
      if (error?.message === "Session not found") {
        return res.status(404).json({ error: "Sessão não encontrada ou foi removida" });
      }
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
      
      console.log(`🔍 Force deleting session ${sessionId} for user ${user.id}`);
      
      // Force delete directly from Redis to ensure it's removed
      if (client) {
        // Delete session data
        const sessionDeleted = await client.del(`session:${sessionId}`);
        console.log(`🗑️ Direct Redis: Deleted session:${sessionId} (result: ${sessionDeleted})`);
        
        // Remove from user's session set
        const removedCount = await client.srem(`user:${user.id}:sessions`, sessionId);
        console.log(`🗑️ Direct Redis: Removed ${sessionId} from user sessions set (count: ${removedCount})`);
        
        // Clear chat history
        const historyDeleted = await client.del(`user:${user.id}:session:${sessionId}:history`);
        console.log(`🧹 Direct Redis: Cleared chat history for session ${sessionId} (result: ${historyDeleted})`);
        
        // If this was the current session, switch to another
        const currentSession = await client.get(`user:${user.id}:current_session`);
        if (currentSession === sessionId) {
          // Get remaining sessions to switch to
          const sessionIds = await client.smembers(`user:${user.id}:sessions`);
          if (sessionIds.length > 0) {
            await client.set(`user:${user.id}:current_session`, sessionIds[0]);
            console.log(`🔄 Direct Redis: Switched current session to ${sessionIds[0]}`);
          } else {
            await client.del(`user:${user.id}:current_session`);
            console.log(`❌ Direct Redis: No remaining sessions, cleared current session`);
          }
        }
        
        // Verify deletion worked
        const verifySession = await client.get(`session:${sessionId}`);
        const verifyInSet = await client.sismember(`user:${user.id}:sessions`, sessionId);
        console.log(`🔍 Verification: session exists: ${!!verifySession}, in set: ${verifyInSet}`);
      } else {
        console.log('❌ Redis client not available, using storage layer fallback');
        await storage.deleteChatSession(sessionId);
      }
      
      console.log(`✅ Session ${sessionId} force deleted successfully from Redis`);
      
      res.json({ 
        success: true, 
        sessionId,
        message: "Session deleted successfully from Redis"
      });
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

  // Clean duplicate sessions (Admin only)
  app.post("/api/admin/clean-sessions", checkAdmin, async (req, res) => {
    try {
      const username = 'daniel08'; // Only for daniel08
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log('🧹 Admin: Force cleaning all old sessions for user:', user.id);
      
      // Direct Redis cleanup - get all session IDs
      const sessionIdsSet = await client!.smembers(`user:${user.id}:sessions`);
      console.log(`📋 Found ${sessionIdsSet.length} session IDs in Redis set:`, sessionIdsSet);
      
      let deletedCount = 0;
      let keptSessions = [];
      
      // Sort sessions by examining each one
      const sessionDetails = [];
      for (const sessionId of sessionIdsSet) {
        const sessionData = await client!.get(`session:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData as string);
          sessionDetails.push(session);
        } else {
          // Remove orphaned session ID
          await client!.srem(`user:${user.id}:sessions`, sessionId);
          console.log(`🗑️ Removed orphaned session ID: ${sessionId}`);
          deletedCount++;
        }
      }
      
      // Sort by creation date and keep only the 3 most recent
      sessionDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sessionsToKeep = sessionDetails.slice(0, 3);
      const sessionsToDelete = sessionDetails.slice(3);
      
      keptSessions = sessionsToKeep;
      
      console.log(`✅ Keeping ${sessionsToKeep.length} sessions`);
      console.log(`🗑️ Force deleting ${sessionsToDelete.length} old sessions`);
      
      // Force delete old sessions from Redis directly
      for (const session of sessionsToDelete) {
        console.log(`🗑️ Force deleting session: ${session.id} - ${session.title}`);
        
        // Delete session data
        await client!.del(`session:${session.id}`);
        
        // Remove from user's session set
        await client!.srem(`user:${user.id}:sessions`, session.id);
        
        // Clear chat history
        await client!.del(`user:${user.id}:session:${session.id}:history`);
        
        // Clear current session if it was this one
        const currentSession = await client!.get(`user:${user.id}:current_session`);
        if (currentSession === session.id) {
          if (sessionsToKeep.length > 0) {
            await client!.set(`user:${user.id}:current_session`, sessionsToKeep[0].id);
          } else {
            await client!.del(`user:${user.id}:current_session`);
          }
        }
        
        deletedCount++;
      }
      
      await storage.addSystemLog('info', `Admin force cleaned ${deletedCount} old sessions`, `Action by daniel08`);
      
      res.json({ 
        success: true, 
        message: `Limpeza forçada concluída. ${deletedCount} sessões removidas.`,
        kept: keptSessions.length,
        deleted: deletedCount,
        remaining: keptSessions.map(s => ({ id: s.id, title: s.title }))
      });
    } catch (error) {
      console.error("Error force cleaning sessions:", error);
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

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      console.log('📁 File filter check:', file.originalname, file.mimetype);
      // Allow PDFs, images, and text files for testing
      if (file.mimetype === 'application/pdf' || 
          file.mimetype.startsWith('image/') || 
          file.mimetype.startsWith('text/')) {
        cb(null, true);
      } else {
        console.log('❌ File type rejected:', file.mimetype);
        cb(new Error('Apenas PDFs, imagens e arquivos de texto são permitidos') as any, false);
      }
    }
  });

  // Upload and process files
  app.post("/api/files/upload", upload.array('files', 5), async (req, res) => {
    try {
      console.log('📁 Upload request received');
      console.log('📁 Headers:', req.headers);
      console.log('📁 Files received:', req.files);
      console.log('📁 Body:', req.body);
      
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        console.log('❌ No username or anonymous user');
        return res.status(401).json({ error: "Login necessário para fazer upload de arquivos" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('❌ User not found:', username);
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const files = req.files as any[];
      console.log('📁 Files array:', files);
      console.log('📁 Files length:', files?.length);
      
      if (!files || files.length === 0) {
        console.log('❌ No files in request');
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const processedFiles = [];
      for (const file of files) {
        try {
          const attachment = await fileProcessor.processFile(file);
          processedFiles.push(attachment);
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
        }
      }

      res.json({ 
        success: true, 
        files: processedFiles,
        message: `${processedFiles.length} arquivo(s) processado(s) com sucesso`
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ error: "Erro ao fazer upload dos arquivos" });
    }
  });

  // Serve uploaded files
  app.get("/uploads/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = fileProcessor.getFilePath(filename);
      
      if (!fileProcessor.fileExists(filename)) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }

      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Erro ao servir arquivo" });
    }
  });

  // Delete uploaded file
  app.delete("/api/files/:filename", async (req, res) => {
    try {
      const username = req.headers['x-username'] as string;
      
      if (!username || username.includes('anonymous')) {
        return res.status(401).json({ error: "Login necessário" });
      }

      const filename = req.params.filename;
      await fileProcessor.deleteFile(filename);
      
      res.json({ success: true, message: "Arquivo excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Erro ao excluir arquivo" });
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
