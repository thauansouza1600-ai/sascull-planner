import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateCardDescription = async (title: string, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Escreva uma descrição profissional e concisa de gerenciamento de projetos para uma tarefa intitulada "${title}". 
      Contexto: ${context || "Tarefa geral de desenvolvimento de software"}. 
      Inclua critérios de aceitação e um breve resumo. Formate com Markdown. Responda em Português.`,
    });
    return response.text || "Não foi possível gerar a descrição.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao gerar conteúdo. Por favor, verifique sua configuração de API.";
  }
};

export const suggestChecklist = async (title: string, description: string): Promise<string[]> => {
  try {
    const prompt = `
      Para uma tarefa intitulada "${title}" com a descrição "${description}", 
      gere uma lista de 3-5 itens de checklist acionáveis para completar esta tarefa.
      Retorne APENAS os itens, um por linha, sem numeração ou marcadores. Responda em Português.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    const text = response.text || "";
    return text.split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const chatWithAI = async (history: string[], message: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            model: MODEL_NAME,
            config: {
                systemInstruction: "Você é um assistente útil de gerenciamento de projetos usado em um aplicativo de quadro Kanban. Mantenha as respostas concisas e em Português."
            }
        });
        // Note: In a real app, we would hydrate the chat history properly using the Chat API's history format.
        // For this stateless function, we just send the message directly for simplicity in this demo scope.
        const result = await chat.sendMessage({ message });
        return result.text || "";
    } catch (error) {
        return "Desculpe, não posso ajudar agora.";
    }
}