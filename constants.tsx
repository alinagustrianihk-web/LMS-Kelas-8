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
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    content: [
      { type: "h1", text: "Mengenal Recount Text" },
      { type: "p", text: "Recount text adalah teks yang menceritakan kembali kejadian atau pengalaman di masa lalu secara berurutan." },
      { type: "h2", text: "Contoh Teks: A Trip to the Beach" },
      { type: "p", text: "Last month, my family and I went to the beach. We left early in the morning by car. When we arrived, the sun was shining brightly and the wind was blowing gently." },
      {
        type: "p",
        text: "First, we found a nice spot under a big tree. Then, my brother and I ran to the water and started swimming. My parents prepared some sandwiches for lunch. After swimming, we played football on the sand. In the afternoon, we watched the beautiful sunset before going home.",
      },
      { type: "p", text: "We felt very tired but happy because it was a great holiday." },
      { type: "h2", text: "Struktur Teks" },
      { type: "list", items: ["Orientation: Last month, my family and I went to the beach...", "Events: First we found a spot, then we swam, we had lunch...", "Re-orientation: We felt tired but happy..."] },
    ],
    questions: [
      { type: "mcq", q: "Where did the writer go last month?", a: ["Mountain", "Mall", "Museum", "Beach"], correct: 3 },
      { type: "mcq", q: "How did they go there?", a: ["By bus", "By car", "By train", "By motorcycle"], correct: 1 },
      { type: "tf", q: "The writer went to the beach with his family.", correct: true },
      { type: "mcq", q: "What did they do after swimming?", a: ["Played football", "Slept", "Went home", "Had breakfast"], correct: 0 },
      { type: "tf", q: "They felt sad at the end of the trip.", correct: false },
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
