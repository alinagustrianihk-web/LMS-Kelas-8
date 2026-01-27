import { GoogleGenAI, Type } from "@google/genai";
import { Quest, ContentItem, Question } from "../types";

export async function askTutor(topic: string, question: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a helpful AI English Tutor for 8th-grade students. Topic: ${topic}. Question: "${question}". Explain simply with encouragement.`,
    });
    return response.text;
  } catch (error) {
    return "Sensei sedang sibuk. Coba lagi nanti!";
  }
}

/**
 * Helper to clean JSON string from potential markdown wrappers
 */
function cleanJsonString(str: string): string {
  // Remove markdown code blocks if present
  let cleaned = str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return cleaned;
}

export async function generateChapterQuests(chapterId: string, chapterTitle: string, count: number): Promise<Partial<Quest>[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // We use gemini-3-pro-preview for complex curriculum design
    // Adding thinkingBudget to ensure logical progression between quests
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
              title: { type: Type.STRING, description: "Quest title (e.g. 'Intro to Memories')" },
              topic: { type: Type.STRING, description: "Short topic name" },
              rewardPoints: { type: Type.NUMBER },
              content: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "h1, h2, p, or list" },
                    text: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Only for type list" },
                  },
                  required: ["type"],
                },
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "mcq or tf" },
                    q: { type: Type.STRING, description: "The question text" },
                    a: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for mcq" },
                    correct: { type: Type.NUMBER, description: "Index of correct answer for mcq, or 1 for True, 0 for False if tf" },
                  },
                  required: ["type", "q", "correct"],
                },
              },
            },
            required: ["title", "topic", "questions", "content"],
          },
        },
      },
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Empty AI response");

    return JSON.parse(cleanJsonString(rawText));
  } catch (error) {
    console.error("Bulk Generation Error:", error);
    // Rethrow to be caught by the UI
    throw error;
  }
}

export async function generateQuestImage(topic: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: `High-quality colorful 3D educational cinematic illustration for an English learning app. Topic: ${topic}. Style: Pixar-like, vibrant, clear for students.` }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}
