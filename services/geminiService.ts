import { GoogleGenAI, Type } from "@google/genai";
import { Quest, Question } from "../types";

/**
 * AI English Tutor assistant using Gemini.
 * Directly uses process.env.API_KEY for initialization as per guidelines.
 */
export async function askTutor(topic: string, question: string) {
  // Use named parameter for apiKey and process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a helpful AI English Tutor for 8th-grade students. Topic: ${topic}. Question: "${question}". Explain simply with encouragement.`,
    });
    // response.text is a property, not a method
    return response.text;
  } catch (error) {
    console.error("Tutor Error:", error);
    return "Sensei sedang bermeditasi (Error). Mohon coba lagi nanti.";
  }
}

function cleanJsonString(str: string): string {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Bulk generate quests for a chapter using Gemini's JSON output capabilities and responseSchema.
 */
export async function generateChapterQuests(chapterId: string, chapterTitle: string, count: number): Promise<Partial<Quest>[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using pro for complex curriculum generation
      contents: `You are an expert English Curriculum Designer for Indonesian Junior High School (SMP Kelas 8). 
      Generate a sequence of ${count} English learning quests for the chapter "${chapterTitle}".
      
      CRITICAL RULES FOR QUESTIONS:
      1. For 'tf' (True/False) questions: The 'correct' field MUST be a boolean (true or false).
      2. For 'mcq' (Multiple Choice) questions: The 'correct' field MUST be the index of the answer (0, 1, 2, or 3).
      3. Double-check facts: Ensure the 'correct' answer truly matches the question context.
      4. Each quest MUST have exactly 5 questions.
      
      Return ONLY a raw JSON array. No preamble, no markdown.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
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
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["type"],
                },
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    q: { type: Type.STRING },
                    a: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correct: { type: Type.BOOLEAN },
                  },
                  required: ["type", "q"],
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

    // Final mapping for safety to ensure correct types for questions
    const parsed = JSON.parse(cleanJsonString(rawText));
    return parsed.map((q: any) => ({
      ...q,
      questions: q.questions.map((ques: any) => ({
        ...ques,
        correct: ques.type === "tf" ? String(ques.correct) === "true" : Number(ques.correct),
      })),
    }));
  } catch (error: any) {
    console.error("Bulk Generation Error:", error);
    throw error;
  }
}

/**
 * Generate a thematic image for a quest topic using nano banana models.
 */
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

    // Iterate through candidates and parts to find the image data as per guidelines
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}
