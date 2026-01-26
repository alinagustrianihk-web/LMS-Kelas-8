
import { GoogleGenAI } from "@google/genai";

// Initialize AI client inside functions to follow the latest SDK integration patterns
export async function askTutor(topic: string, question: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful AI English Tutor for junior high school students. 
      The current topic is: ${topic}. 
      Student asks: "${question}"
      Explain simply, clearly, and in a friendly way. Use a mix of Indonesian and English if necessary. Keep it encouraging.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, Sensei sedang sibuk. Coba lagi nanti ya!";
  }
}

export async function generateNewQuestTopic() {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a new specific topic for an English Recount Text quest for 8th graders. Example: 'Personal Experience', 'Historical Events'. Just return the title.",
    });
    return response.text;
  } catch (error) {
    return "Random Journey";
  }
}
