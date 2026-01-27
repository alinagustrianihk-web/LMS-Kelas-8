import { GoogleGenAI, Type } from "@google/genai";
import { Quest, Question } from "../types";

/**
 * AI English Tutor assistant using Gemini.
 */
export async function askTutor(topic: string, question: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a helpful AI English Tutor for 8th-grade students. Topic: ${topic}. Question: "${question}". Explain simply with encouragement.`,
    });
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
 * Bulk generate quests for a chapter using optional API key and custom question count per quest.
 */
export async function generateChapterQuests(chapterId: string, chapterTitle: string, questCount: number, apiKey?: string, questionsPerQuest: number = 5): Promise<Partial<Quest>[]> {
  const activeKey = apiKey && apiKey.trim() !== "" ? apiKey : process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: activeKey });

  try {
    const response = await ai.models.generateContent({
      // Diubah ke Flash agar lebih stabil dan kuota lebih banyak
      model: "gemini-3-flash-preview",
      contents: `You are an expert English Curriculum Designer for Indonesian Junior High School (SMP Kelas 8). 
      Generate a sequence of ${questCount} English learning quests for the chapter "${chapterTitle}".
      
      CRITICAL RULES FOR SCORING AND STRUCTURE:
      1. For 'tf' (True/False) questions: set 'correct' to "true" or "false" as a string.
      2. For 'mcq' (Multiple Choice) questions: set 'correct' to the index "0", "1", "2", or "3" as a string.
      3. Each individual quest must have EXACTLY ${questionsPerQuest} questions.
      4. Ensure MCQ options are relevant to the topic.
      5. The content should be educational and formatted correctly.
      
      Return ONLY a raw JSON array.`,
      config: {
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
                    correct: { type: Type.STRING, description: "The correct answer index for mcq or 'true'/'false' for tf" },
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

    const parsed = JSON.parse(cleanJsonString(rawText));
    return parsed.map((q: any) => ({
      ...q,
      questions: q.questions.map((ques: any) => {
        let normalizedCorrect: any;
        if (ques.type === "tf") {
          normalizedCorrect = String(ques.correct).toLowerCase() === "true";
        } else {
          normalizedCorrect = parseInt(String(ques.correct), 10);
          if (isNaN(normalizedCorrect)) normalizedCorrect = 0;
        }

        return {
          ...ques,
          correct: normalizedCorrect,
        };
      }),
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
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: `Educational illustration for ${topic}. Pixar style.` }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    return null;
  }
}
