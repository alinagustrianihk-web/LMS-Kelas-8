import { GoogleGenAI, Type } from "@google/genai";
import { Quest, Question } from "../types";

/**
 * Helper to get the most valid API Key available
 */
const getActiveApiKey = () => {
  const manualKey = localStorage.getItem("quest8_api_key");
  return manualKey && manualKey.length > 10 ? manualKey : process.env.API_KEY || "";
};

/**
 * AI English Tutor assistant using Gemini.
 */
export async function askTutor(topic: string, question: string) {
  const apiKey = getActiveApiKey();
  if (!apiKey) return "Sensei belum diaktifkan. Mohon masukkan Kode Akses di menu Settings.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a helpful AI English Tutor for 8th-grade students. Topic: ${topic}. Question: "${question}". Explain simply with encouragement.`,
    });
    return response.text;
  } catch (error) {
    console.error("Tutor Error:", error);
    return "Sensei sedang bermeditasi (Error). Mohon cek koneksi atau Kode Akses Anda.";
  }
}

function cleanJsonString(str: string): string {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Bulk generate quests for a chapter.
 */
export async function generateChapterQuests(chapterId: string, chapterTitle: string, questCount: number, questionsPerQuest: number = 5): Promise<Partial<Quest>[]> {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert English Curriculum Designer for Indonesian Junior High School (SMP Kelas 8). 
      Generate a sequence of ${questCount} English learning quests for the chapter "${chapterTitle}".
      
      SETIAP QUEST WAJIB MEMILIKI MATERI EDUKASI (CONTENT):
      - Bagian 'content' HARUS diisi dengan materi pelajaran yang lengkap sebagai bahan bacaan siswa.
      - Gunakan 'h1' untuk judul materi.
      - Gunakan 'h2' untuk sub-judul.
      - Gunakan 'p' untuk penjelasan detail (Gunakan campuran Bahasa Inggris dan Indonesia agar mudah dipahami).
      - Gunakan 'list' untuk daftar kosakata (vocabulary) atau aturan tata bahasa (grammar rules).
      
      CRITICAL RULES FOR SCORING AND STRUCTURE:
      1. For 'tf' (True/False) questions: set 'correct' to "true" or "false" as a string.
      2. For 'mcq' (Multiple Choice) questions: set 'correct' to the index "0", "1", "2", or "3" as a string.
      3. Each individual quest must have EXACTLY ${questionsPerQuest} questions.
      4. Ensure MCQ options are relevant to the topic.
      5. 'content' (materi) tidak boleh kosong. Ini adalah bagian terpenting bagi siswa untuk belajar sebelum kuis.
      
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
                    type: { type: Type.STRING, description: "Must be one of: h1, h2, p, list" },
                    text: { type: Type.STRING, description: "Text for h1, h2, or p" },
                    items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of strings for type 'list'" },
                  },
                  required: ["type"],
                },
                description: "Array of educational content objects (the 'materi')",
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
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
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
