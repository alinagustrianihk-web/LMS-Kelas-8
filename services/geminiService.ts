
import { GoogleGenAI, Type } from "@google/genai";
import { Quest, Question } from "../types";

/**
 * AI English Tutor assistant using Gemini.
 */
export async function askTutor(topic: string, question: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful AI English Tutor for 8th-grade students. Topic: ${topic}. Question: "${question}". Explain simply with encouragement.`,
    });
    return response.text;
  } catch (error) {
    console.error("Tutor Error:", error);
    return "Sensei sedang bermeditasi (Error). Mohon coba lagi nanti.";
  }
}

function cleanJsonString(str: string): string {
  return str.replace(/```json/g, "").replace(/```/g, "").trim();
}

/**
 * Bulk generate quests for a chapter with strict logical verification.
 */
export async function generateChapterQuests(chapterId: string, chapterTitle: string, count: number): Promise<Partial<Quest>[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert English Curriculum Designer for Indonesian Junior High School (SMP Kelas 8). 
      Generate a sequence of ${count} English learning quests for the chapter "${chapterTitle}".
      
      CRITICAL LOGICAL RULES:
      1. For 'tf' (True/False) questions: 
         - The 'correct' field MUST be a boolean (true or false).
         - DOUBLE CHECK: If the statement is "Recount text is about the future", 'correct' MUST be false.
         - DOUBLE CHECK: If the statement is "Recount text is chronological", 'correct' MUST be true.
      2. For 'mcq' (Multiple Choice):
         - Provide 4 options in 'a' array.
         - 'correct' MUST be the exact index (0-3).
      3. Verify every question against 8th-grade curriculum standards.
      
      Return ONLY a raw JSON array. No preamble.`,
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
                    correct: { type: Type.BOOLEAN } 
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
    
    const parsed = JSON.parse(cleanJsonString(rawText));
    return parsed.map((q: any) => ({
      ...q,
      questions: q.questions.map((ques: any) => ({
        ...ques,
        // Strict casting based on type
        correct: ques.type === 'tf' ? Boolean(ques.correct) : Number(ques.correct)
      }))
    }));
  } catch (error: any) {
    console.error("Bulk Generation Error:", error);
    throw error;
  }
}

export async function generateQuestImage(topic: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `3D educational illustration. Topic: ${topic}. Pixar style.` }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}
