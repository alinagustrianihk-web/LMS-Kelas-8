
import { GoogleGenAI, Type } from "@google/genai";
import { Quest, ContentItem, Question } from "../types";

// Helper untuk mengambil API Key dari storage browser
const getStoredApiKey = () => localStorage.getItem('quest8_ai_key') || '';

export async function askTutor(topic: string, question: string) {
  const apiKey = getStoredApiKey();
  if (!apiKey) return "Sensei butuh API Key untuk menjawab. Silakan minta bantuan Guru atau Admin untuk mengaturnya di Settings.";
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful AI English Tutor for 8th-grade students. Topic: ${topic}. Question: "${question}". Explain simply with encouragement.`,
    });
    return response.text;
  } catch (error) {
    console.error("Tutor Error:", error);
    return "Sensei sedang bermeditasi (Error). Pastikan API Key benar dan coba lagi!";
  }
}

function cleanJsonString(str: string): string {
  let cleaned = str.replace(/```json/g, "").replace(/```/g, "").trim();
  return cleaned;
}

export async function generateChapterQuests(chapterId: string, chapterTitle: string, count: number): Promise<Partial<Quest>[]> {
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error("API Key belum diatur. Silakan atur di tab Settings.");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert English Curriculum Designer. 
      Generate a sequence of ${count} English learning quests for 8th-grade students for the chapter "${chapterTitle}".
      
      CRITICAL RULES:
      1. Each quest MUST have a unique title and a specific topic related to "${chapterTitle}".
      2. Each quest MUST have exactly 5 questions (mix of 'mcq' with 4 options 'a', and 'tf').
      3. Content MUST include at least one 'h1' and two 'p' items.
      4. Ensure pedagogical progression (easier quests first).
      5. Return ONLY a raw JSON array. No preamble, no markdown formatting.`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              topic: { type: Type.STRING },
              rewardPoints: { type: Type.NUMBER },
              content: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["type"]
                }
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    q: { type: Type.STRING },
                    a: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct: { type: Type.NUMBER }
                  },
                  required: ["type", "q", "correct"]
                }
              }
            },
            required: ["title", "topic", "questions", "content"]
          }
        }
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Empty AI response");
    
    return JSON.parse(cleanJsonString(rawText));
  } catch (error) {
    console.error("Bulk Generation Error:", error);
    throw error;
  }
}

export async function generateQuestImage(topic: string) {
  const apiKey = getStoredApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-quality colorful 3D educational cinematic illustration for an English learning app. Topic: ${topic}. Style: Pixar-like, vibrant, clear for students.` }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}
