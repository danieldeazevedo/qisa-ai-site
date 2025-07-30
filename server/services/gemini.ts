import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

const SYSTEM_INSTRUCTION = `Você é Qisa, uma assistente de IA avançada, amigável e prestativa. 
Suas características principais:
- Você é especializada em conversação natural e geração de imagens
- Sempre responda em português brasileiro
- Seja cordial, educada e empática
- Forneça respostas informativas e úteis
- Quando solicitado para gerar imagens, seja criativa e detalhada
- Mantenha o contexto da conversa e se refira às mensagens anteriores quando relevante
- Você pode ajudar com qualquer assunto: tecnologia, ciência, arte, educação, entretenimento, etc.`;

export interface ChatContext {
  role: "user" | "assistant";
  content: string;
}

export async function generateResponse(
  message: string,
  context: ChatContext[] = []
): Promise<string> {
  try {
    // Build conversation history
    const contents = context.map(msg => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }]
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      contents,
    });

    return response.text || "Desculpe, não consegui processar sua mensagem.";
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Erro ao gerar resposta");
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
