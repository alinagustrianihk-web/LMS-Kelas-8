import { Quest, Chapter, User, UserRole } from "./types";

export const CHAPTERS: Chapter[] = [
  { id: "bab1", order: 1, title: "Bab 1: Unforgettable Experience", description: "Mastering Recount Texts through past memories.", totalQuests: 9 },
  { id: "bab2", order: 2, title: "Bab 2: Which One is Better?", description: "Exploring Comparison Degrees and Adjectives.", totalQuests: 7 },
  { id: "bab3", order: 3, title: "Bab 3: Love Our Earth", description: "Learning Adverbs of Manner and Environmental Care.", totalQuests: 7 },
  { id: "bab4", order: 4, title: "Bab 4: No Littering", description: "Procedure Texts and Imperative Sentences.", totalQuests: 4 },
];

export const INITIAL_CURRICULUM: Quest[] = [
  {
    id: "q1",
    chapterId: "bab1",
    chapterTitle: "Unforgettable Experience",
    order: 1,
    title: "Quest 1",
    topic: "Introduction to Recount Text",
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    content: [
      { type: "h1", text: "Apa itu Recount Text?" },
      { type: "p", text: "Recount text adalah teks yang menceritakan kembali kejadian atau pengalaman di masa lalu secara berurutan." },
      { type: "h2", text: "Struktur Teks (Generic Structure)" },
      { type: "list", items: ["Orientation: Pengenalan tokoh, tempat, dan waktu.", "Events: Rekaman kejadian sesuai urutan kronologis.", "Re-orientation: Penutup atau kesan pribadi penulis."] },
    ],
    questions: [
      { type: "mcq", q: "Apa tujuan utama Recount Text?", a: ["Menghibur/Memberi info masa lalu", "Menjelaskan cara membuat sesuatu", "Membujuk pembaca", "Mendeskripsikan benda"], correct: 0 },
      { type: "mcq", q: "Bagian mana yang memperkenalkan tokoh dan setting?", a: ["Events", "Orientation", "Re-orientation", "Conclusion"], correct: 1 },
      { type: "tf", q: "Recount text menggunakan Simple Past Tense.", correct: true },
      { type: "mcq", q: "Apa yang biasanya diceritakan dalam 'Events'?", a: ["Perkenalan", "Urutan kejadian", "Pesan moral", "Bahan-bahan"], correct: 1 },
      { type: "tf", q: "Orientation terletak di akhir paragraf.", correct: false },
    ],
    status: "published",
  },
];

export const DEFAULT_USERS: User[] = [
  {
    id: "u1",
    username: "admin",
    password: "admin123",
    name: "Super Admin",
    role: UserRole.ADMIN,
    xp: 0,
    streak: 0,
    unlockedChapters: ["bab1", "bab2", "bab3", "bab4"],
  },
  {
    id: "u2",
    username: "guru",
    password: "guru123",
    name: "Bpk. Ayi Fauzi",
    role: UserRole.TEACHER,
    xp: 0,
    streak: 0,
    unlockedChapters: ["bab1", "bab2", "bab3", "bab4"],
  },
  {
    id: "u3",
    username: "siswa",
    password: "siswa",
    name: "Ahmad Ridwan",
    role: UserRole.STUDENT,
    xp: 450,
    streak: 5,
    unlockedChapters: ["bab1"],
  },
];
