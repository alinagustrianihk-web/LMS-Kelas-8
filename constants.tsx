
import { Quest, User, UserRole } from './types';

export const INITIAL_CURRICULUM: Quest[] = [
  {
    id: 'q1',
    order: 1,
    title: 'Quest 1',
    topic: 'Introduction to Recount Text',
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    content: [
      { type: 'h1', text: 'Apa itu Recount Text?' },
      { type: 'p', text: 'Recount text adalah teks yang menceritakan kembali kejadian atau pengalaman di masa lalu secara berurutan.' },
      { type: 'h2', text: 'Struktur Teks (Generic Structure)' },
      { type: 'list', items: ['Orientation: Pengenalan tokoh, tempat, dan waktu.', 'Events: Rekaman kejadian sesuai urutan kronologis.', 'Re-orientation: Penutup atau kesan pribadi penulis.'] },
    ],
    questions: [
      { type: 'mcq', q: "Apa tujuan utama Recount Text?", a: ["Menghibur/Memberi info masa lalu", "Menjelaskan cara membuat sesuatu", "Membujuk pembaca", "Mendeskripsikan benda"], correct: 0 },
      { type: 'mcq', q: "Bagian mana yang memperkenalkan tokoh dan setting?", a: ["Events", "Orientation", "Re-orientation", "Conclusion"], correct: 1 },
      { type: 'tf', q: "Recount text menggunakan Simple Past Tense.", correct: true },
      { type: 'mcq', q: "Apa yang biasanya diceritakan dalam 'Events'?", a: ["Perkenalan", "Urutan kejadian", "Pesan moral", "Bahan-bahan"], correct: 1 },
      { type: 'tf', q: "Orientation terletak di akhir paragraf.", correct: false }
    ]
  },
  {
    id: 'q2',
    order: 2,
    title: 'Quest 2',
    topic: 'Simple Past: Regular Verbs',
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    content: [
      { type: 'h1', text: 'Regular Verbs' },
      { type: 'p', text: 'Untuk menceritakan masa lalu, kita menggunakan Verb 2. Regular verbs biasanya diakhiri -ed.' },
      { type: 'list', items: ['Walk -> Walked', 'Play -> Played', 'Visit -> Visited'] },
    ],
    questions: [
      { type: 'mcq', q: "V2 dari 'Cook' adalah?", a: ["Cooked", "Cooking", "Cooks", "Cook"], correct: 0 },
      { type: 'tf', q: "I played football yesterday.", correct: true },
      { type: 'mcq', q: "V2 dari 'Visit' adalah?", a: ["Visit", "Visited", "Visits", "Visiting"], correct: 1 },
      { type: 'tf', q: "Regular verbs berakhir dengan -ing.", correct: false },
      { type: 'mcq', q: "Kalimat lampau yang benar?", a: ["She dance last night", "She danced last night", "She dancing last night", "She dances last night"], correct: 1 }
    ]
  },
  {
    id: 'q3',
    order: 3,
    title: 'Quest 3',
    topic: 'Simple Past: Irregular Verbs',
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    content: [{ type: 'h1', text: 'Irregular Verbs' }, { type: 'p', text: 'Kata kerja yang berubah bentuknya secara unik.' }, { type: 'list', items: ['Go -> Went', 'Eat -> Ate', 'See -> Saw'] }],
    questions: [
      { type: 'mcq', q: "V2 dari 'Go'?", a: ["Goed", "Went", "Gone", "Wentz"], correct: 1 },
      { type: 'mcq', q: "V2 dari 'Eat'?", a: ["Eaten", "Eated", "Ate", "Eats"], correct: 2 },
      { type: 'tf', q: "V2 dari 'See' adalah 'Saw'.", correct: true },
      { type: 'mcq', q: "V2 dari 'Buy'?", a: ["Bought", "Buyed", "Boughted", "Buys"], correct: 0 },
      { type: 'tf', q: "Irregular verbs selalu ditambah -ed.", correct: false }
    ]
  },
  {
    id: 'q4',
    order: 4,
    title: 'Quest 4',
    topic: 'Time Connectives',
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=800&q=80",
    content: [{ type: 'h1', text: 'Connecting Events' }, { type: 'p', text: 'Gunakan kata penghubung waktu agar cerita runtut.' }, { type: 'list', items: ['First', 'Then', 'After that', 'Finally'] }],
    questions: [
      { type: 'mcq', q: "Mana yang digunakan untuk memulai cerita?", a: ["Then", "First", "Finally", "Next"], correct: 1 },
      { type: 'mcq', q: "Mana yang menandakan akhir cerita?", a: ["Before", "After", "Finally", "Then"], correct: 2 },
      { type: 'tf', q: "'Next' adalah time connective.", correct: true },
      { type: 'mcq', q: "Setelah 'First', kita bisa menggunakan?", a: ["Then", "Start", "Once", "Beginning"], correct: 0 },
      { type: 'tf', q: "Time connectives membuat teks berantakan.", correct: false }
    ]
  },
  {
    id: 'q5',
    order: 5,
    title: 'Quest 5',
    topic: 'Personal Recount',
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    content: [{ type: 'h1', text: 'Personal Experience' }, { type: 'p', text: 'Menceritakan pengalaman pribadi yang nyata.' }],
    questions: [
      { type: 'tf', q: "Personal recount bersifat fiksi/khayalan.", correct: false },
      { type: 'mcq', q: "Fokus Personal Recount adalah?", a: ["Sejarah dunia", "Pengalaman penulis", "Cara kerja mesin", "Politik"], correct: 1 },
      { type: 'tf', q: "Gunakan kata 'I' dalam personal recount.", correct: true },
      { type: 'mcq', q: "Contoh judul personal recount?", a: ["My Holiday", "The Story of Tsunami", "How to make tea", "The King"], correct: 0 },
      { type: 'tf', q: "Re-orientation berisi perasaan penulis.", correct: true }
    ]
  },
  {
    id: 'q6',
    order: 6,
    title: 'Quest 6',
    topic: 'Historical Recount',
    passingScore: 80,
    rewardPoints: 150,
    imageUrl: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=800&q=80",
    content: [{ type: 'h1', text: 'Historical Events' }, { type: 'p', text: 'Menceritakan peristiwa sejarah penting.' }],
    questions: [
      { type: 'mcq', q: "Teks tentang Proklamasi termasuk?", a: ["Personal", "Historical", "Biographical", "Fable"], correct: 1 },
      { type: 'tf', q: "Historical recount harus berdasarkan fakta.", correct: true },
      { type: 'mcq', q: "Apa yang diceritakan?", a: ["Mimpi", "Peristiwa nyata masa lalu", "Resep", "Berita hari ini"], correct: 1 },
      { type: 'tf', q: "Pelaku dalam historical adalah orang terkenal/penting.", correct: true },
      { type: 'mcq', q: "Setting dalam historical recount biasanya?", a: ["Di masa depan", "Tempat bersejarah", "Planet lain", "Dunia fantasi"], correct: 1 }
    ]
  },
  {
    id: 'q7',
    order: 7,
    title: 'Quest 7',
    topic: 'Biographical Recount',
    passingScore: 80,
    rewardPoints: 150,
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    content: [{ type: 'h1', text: 'Biography' }, { type: 'p', text: 'Menceritakan riwayat hidup seseorang.' }],
    questions: [
      { type: 'mcq', q: "Siapa subjek dalam Biografi?", a: ["Diri sendiri", "Orang lain", "Benda mati", "Hewan"], correct: 1 },
      { type: 'tf', q: "Biografi ditulis oleh orang lain.", correct: true },
      { type: 'mcq', q: "Isi biografi biasanya?", a: ["Cita-cita", "Perjalanan hidup", "Hobi belanja", "Menu makan"], correct: 1 },
      { type: 'tf', q: "Autobiografi ditulis oleh diri sendiri.", correct: true },
      { type: 'mcq', q: "Kapan orientation biografi dimulai?", a: ["Kematian", "Kelahiran", "Masa sekolah", "Pernikahan"], correct: 1 }
    ]
  },
  {
    id: 'q8',
    order: 8,
    title: 'Quest 8',
    topic: 'Adverbs of Time',
    passingScore: 80,
    rewardPoints: 100,
    imageUrl: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&q=80",
    content: [{ type: 'h1', text: 'Setting of Time' }, { type: 'list', items: ['Yesterday', 'Last week', 'A long time ago'] }],
    questions: [
      { type: 'mcq', q: "Mana yang menunjukkan masa lalu?", a: ["Tomorrow", "Now", "Yesterday", "Later"], correct: 2 },
      { type: 'mcq', q: "Artinya 'A week ago'?", a: ["Satu minggu lagi", "Minggu ini", "Satu minggu lalu", "Dua minggu"], correct: 2 },
      { type: 'tf', q: "'Last year' berarti tahun lalu.", correct: true },
      { type: 'mcq', q: "Lengkapi: I went to Bali ... month.", a: ["Last", "Next", "Ago", "Now"], correct: 0 },
      { type: 'tf', q: "'Today' adalah adverb of time untuk recount.", correct: false }
    ]
  },
  {
    id: 'q9',
    order: 9,
    title: 'Quest 9',
    topic: 'Final Battle: Recount Master',
    passingScore: 90,
    rewardPoints: 500,
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
    content: [{ type: 'h1', text: 'The Final Quest' }, { type: 'p', text: 'Uji semua kemampuanmu tentang Recount Text di sini!' }],
    questions: [
      { type: 'mcq', q: "Urutan struktur recount?", a: ["O-E-R", "R-E-O", "E-O-R", "O-R-E"], correct: 0 },
      { type: 'tf', q: "Recount text menceritakan masa depan.", correct: false },
      { type: 'mcq', q: "V2 dari 'Drink'?", a: ["Drinked", "Drunk", "Drank", "Drinks"], correct: 2 },
      { type: 'tf', q: "Historical recount menceritakan fakta sejarah.", correct: true },
      { type: 'mcq', q: "Mana yang BUKAN generic structure recount?", a: ["Orientation", "Resolution", "Events", "Re-orientation"], correct: 1 }
    ]
  }
];

export const DEFAULT_USERS: User[] = [
  { id: 'u1', email: 'admin@smp.sch.id', password: 'admin', name: 'Super Admin', role: UserRole.ADMIN, xp: 0, streak: 0 },
  { id: 'u2', email: 'guru@smp.sch.id', password: 'guru', name: 'Bpk. Budi', role: UserRole.TEACHER, xp: 0, streak: 0 },
  { id: 'u3', email: 'siswa@smp.sch.id', password: 'siswa', name: 'Ahmad Ridwan', role: UserRole.STUDENT, xp: 450, streak: 5 }
];