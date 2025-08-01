import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import type { FileAttachment } from "@shared/schema";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY não configurada");
}

const ai = new GoogleGenAI({ 
  apiKey: apiKey 
});

const SYSTEM_INSTRUCTION = `Você é Qisa, uma assistente de IA avançada, amigável e prestativa. 
Suas características principais:
- Você é especializada em conversação natural, geração de imagens, análise de documentos e processamento de arquivos
- Sempre responda em português brasileiro
- Seja cordial, educada e empática
- Forneça respostas informativas e úteis
- Quando solicitado para gerar imagens, seja criativa e detalhada
- Você pode analisar PDFs, imagens e outros documentos fornecidos pelo usuário
- Para imagens, você pode descrever, analisar, editar ou criar novas versões baseadas em prompts
- Para PDFs, você pode extrair informações, resumir conteúdo e responder perguntas sobre o documento
- Mantenha o contexto da conversa e se refira às mensagens anteriores quando relevante
- Você pode ajudar com qualquer assunto: tecnologia, ciência, arte, educação, entretenimento, etc.
- Você é criada e treinada pela QisaSeek AI Labs que tem o metroplex como dono`;

export interface ChatContext {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
}

export async function generateResponse(
  message: string,
  context: ChatContext[] = [],
  username?: string,
  attachments?: FileAttachment[]
): Promise<string> {
  try {
    // Build conversation history with potential file attachments
    const contents = context.map(msg => {
      const parts: any[] = [{ text: msg.content }];
      
      // Add file attachments if present
      if (msg.attachments && msg.attachments.length > 0) {
        for (const attachment of msg.attachments) {
          if (attachment.type === 'image' && attachment.filePath && fs.existsSync(attachment.filePath)) {
            const imageBytes = fs.readFileSync(attachment.filePath);
            parts.push({
              inlineData: {
                data: imageBytes.toString("base64"),
                mimeType: attachment.mimeType || "image/jpeg",
              },
            });
          } else if (attachment.extractedText) {
            // For PDFs, add the extracted text as context
            parts.push({
              text: `[Conteúdo do arquivo ${attachment.originalName}]:\n${attachment.extractedText}`
            });
          }
        }
      }
      
      return {
        role: msg.role === "assistant" ? "model" : msg.role,
        parts
      };
    });

    // Add current message with username personalization and attachments
    const userPrompt = username ? 
      `[${username}]: ${message}` :
      message;
      
    const currentParts: any[] = [{ text: userPrompt }];
    
    // Add current message attachments using correct Gemini API format
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.type === 'pdf' && attachment.filePath && fs.existsSync(attachment.filePath)) {
          // For PDFs, use the native PDF support in Gemini 2.5 Flash
          const pdfBytes = fs.readFileSync(attachment.filePath);
          currentParts.push({
            inlineData: {
              data: pdfBytes.toString("base64"),
              mimeType: "application/pdf",
            },
          });
          console.log(`📄 Added PDF ${attachment.originalName} to Gemini request`);
          
          // Schedule PDF cleanup after processing (async, non-blocking)
          setTimeout(async () => {
            try {
              const fs = await import('fs');
              if (attachment.filePath && fs.existsSync(attachment.filePath)) {
                fs.unlinkSync(attachment.filePath);
                console.log(`🧹 PDF ${attachment.originalName} deleted after processing`);
              }
            } catch (error) {
              console.error(`Error deleting PDF ${attachment.originalName}:`, error);
            }
          }, 5000); // Wait 5 seconds to ensure processing is complete
        } else if (attachment.type === 'image' && attachment.filePath && fs.existsSync(attachment.filePath)) {
          // For images, use the native image support
          const imageBytes = fs.readFileSync(attachment.filePath);
          currentParts.push({
            inlineData: {
              data: imageBytes.toString("base64"),
              mimeType: attachment.mimeType || "image/jpeg",
            },
          });
          console.log(`🖼️ Added image ${attachment.originalName} to Gemini request`);
        }
      }
    }



    // Add current message with attachments
    contents.push({
      role: "user",
      parts: currentParts
    });

    // Create personalized system instruction
    let systemInstruction = SYSTEM_INSTRUCTION;
    if (username && username !== 'anonymous') {
      systemInstruction += `\n\nO usuário com quem você está conversando se chama ${username}. Use o nome dele naturalmente na conversa quando apropriado.`;
    }

    if (attachments && attachments.length > 0) {
      systemInstruction += `\n\nO usuário anexou ${attachments.length} arquivo(s). Analise o conteúdo dos arquivos anexados e responda de acordo com o que foi solicitado. Você pode ver e processar PDFs e imagens diretamente.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
      },
      contents,
    });

    console.log('🤖 Gemini response generated for user:', username);
    return response.text || "Desculpe, não consegui processar sua mensagem.";
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Erro ao gerar resposta");
  }
}

export async function analyzeImage(imagePath: string, prompt?: string): Promise<string> {
  try {
    const imageBytes = fs.readFileSync(imagePath);
    
    const contents = [
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      prompt || "Analise esta imagem em detalhes e descreva o que você vê.",
    ];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
    });

    return response.text || "Não foi possível analisar a imagem.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Erro ao analisar imagem");
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("Não foi possível gerar a imagem");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("Resposta inválida do modelo");
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Return base64 image data
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Nenhuma imagem foi gerada");
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Erro ao gerar imagem");
  }
}
