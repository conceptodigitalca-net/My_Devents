import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set
const ai = new GoogleGenAI({ apiKey });

export const generateCreativeText = async (prompt: string, type: 'title' | 'description' | 'cta'): Promise<string> => {
  if (!apiKey) return "API Key missing";

  try {
    const model = 'gemini-3-flash-preview';
    const finalPrompt = `You are a creative copywriter for luxury events. Write a short, engaging ${type} for an invitation based on this context: "${prompt}". Keep it under 20 words.`;
    
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
    });

    return response.text || "Welcome to our event";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Celebrate with us";
  }
};