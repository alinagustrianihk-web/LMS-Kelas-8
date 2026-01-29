import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  Trash2,
  Loader2,
  Bot,
  Layers,
  Map,
  Settings2,
  Sparkles,
  LogIn,
  Zap,
  Gift,
  Globe,
  LockIcon,
  Award,
  User as UserIcon,
  UserPlus,
  Key,
  ListChecks,
  Trophy,
  Crown,
  Medal,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  X,
  Activity,
  Wifi,
  WifiOff,
  Link,
  RotateCcw,
  Save,
  ClipboardCheck,
} from "lucide-react";
import { INITIAL_CURRICULUM, DEFAULT_USERS, CHAPTERS } from "./constants.tsx";
import { User, UserRole, Quest, Progress, SystemConfig, Chapter } from "./types.ts";
import Layout from "./components/Layout.tsx";
import QuizEngine from "./components/QuizEngine.tsx";
import AISensei from "./components/AISensei.tsx";
import { dbService } from "./services/dbService.ts";
import { generateQuestImage, generateChapterQuests } from "./services/geminiService.ts";

// --- Global helper for AI Studio bridge ---
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// --- Sub-components ---

const ContentRenderer: React.FC<{ content: Quest["content"]; compact?: boolean }> = ({ content, compact }) => (
  <div className={compact ? "space-y-4" : "space-y-6 md:space-y-8"}>
    {content.map((item, idx) => {
      if (item.type === "h1")
        return (
          <h1 key={idx} className={`${compact ? "text-lg md:text-xl" : "text-2xl md:text-4xl"} font-black text-white border-l-4 md:border-l-8 border-indigo-600 pl-4 md:pl-6 uppercase`}>
            {item.text}
          </h1>
        );
      if (item.type === "h2")
        return (
          <h2 key={idx} className={`${compact ? "text-sm md:text-base" : "text-lg md:text-xl"} font-bold text-indigo-400 uppercase flex items-center gap-3`}>
            <div className="w-4 md:w-8 h-[2px] bg-indigo-900" />
            {item.text}
          </h2>
        );
      if (item.type === "p")
        return (
          <p key={idx} className={`${compact ? "text-xs md:text-sm" : "text-slate-300 text-base md:text-lg"} font-medium leading-relaxed text-slate-300`}>
            {item.text}
          </p>
        );
      if (item.type === "list")
        return (
          <ul key={idx} className={`space-y-2 bg-slate-900/50 ${compact ? "p-3 md:p-5" : "p-5 md:p-8"} rounded-2xl md:rounded-[2.5rem] border-2 border-slate-800`}>
            {item.items?.map((li, i) => (
              <li key={i} className="flex gap-2 md:gap-4 text-slate-300 font-bold text-[10px] md:text-sm items-start">
                <div className="w-4 h-4 md:w-6 md:h-6 shrink-0 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 text-[8px] md:text-[10px] border border-indigo-900/50">{i + 1}</div>
                <span>{li}</span>
              </li>
            ))}
          </ul>
        );
      return null;
    })}
  </div>
);

const LeaderboardList: React.FC<{ users: User[]; limit?: number; highlightId?: string }> = ({ users, limit, highlightId }) => {
  const students = [...users]
    .filter((u) => u.role === UserRole.STUDENT)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit || users.length);

  return (
    <div className="space-y-3">
      {students.map((s, idx) => {
        const isTop3 = idx < 3;
        const isMe = s.id === highlightId;
        return (
          <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMe ? "bg-indigo-600/20 border-indigo-500/50 ring-1 ring-indigo-500" : "bg-slate-950 border-slate-800"}`}>
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  idx === 0 ? "bg-amber-500 text-amber-950" : idx === 1 ? "bg-slate-300 text-slate-900" : idx === 2 ? "bg-orange-600 text-orange-100" : "bg-slate-900 text-slate-500 border border-slate-800"
                }`}
              >
                {idx + 1}
              </div>
              <div>
                <p className={`text-sm font-bold italic line-clamp-1 ${isMe ? "text-white" : "text-slate-200"}`}>
                  {s.name} {isMe && "(You)"}
                </p>
                <p className="text-[9px] font-black text-slate-500 uppercase">@{s.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-indigo-400">
                {s.xp} <span className="text-[8px] uppercase">XP</span>
              </p>
              {isTop3 && <div className="flex justify-end mt-0.5">{idx === 0 ? <Crown size={12} className="text-amber-500" /> : <Medal size={12} className={idx === 1 ? "text-slate-300" : "text-orange-600"} />}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Student Dashboard Component ---
const StudentDashboard = ({ user, dbUsers, dbProgress, dbLevels, setActiveQuest, setView, setIsQuizMode }: any) => {
  const [selectedChapter, setSelectedChapter] = useState<string>(user?.unlockedChapters?.[0] || "bab1");

  const chapterQuests = dbLevels.filter((q: any) => q.chapterId === selectedChapter && q.status === "published");

  const getQuestStatus = (questId: string) => {
    return dbProgress.some((p: any) => p.userId === user.id && p.levelId === questId);
  };

  const isChapterUnlocked = (chapterId: string) => {
    return user?.unlockedChapters?.includes(chapterId);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic text-white tracking-tighter">
            Welcome back, <span className="text-indigo-500">{user.name}</span>
          </h2>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.3em] text-[10px]">Your Learning Journey Continues</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 px-6 py-4 rounded-3xl border border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total XP</p>
            <p className="text-xl font-black text-white">{user.xp}</p>
          </div>
          <div className="bg-slate-900 px-6 py-4 rounded-3xl border border-slate-800 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Streak</p>
            <p className="text-xl font-black text-white">
              {user.streak || 0} <span className="text-xs text-orange-500">🔥</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Select Chapter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHAPTERS.map((chap) => {
            const unlocked = isChapterUnlocked(chap.id);
            const active = selectedChapter === chap.id;
            return (
              <button
                key={chap.id}
                onClick={() => unlocked && setSelectedChapter(chap.id)}
                className={`relative p-6 rounded-[2rem] border-2 transition-all text-left group ${
                  active ? "bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-900/40" : unlocked ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-slate-950 border-slate-900 opacity-60 grayscale cursor-not-allowed"
                }`}
              >
                {!unlocked && <LockIcon className="absolute top-4 right-4 text-slate-700" size={16} />}
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${active ? "text-indigo-200" : "text-slate-500"}`}>Chapter {chap.order}</p>
                <h4 className={`text-sm font-black italic leading-tight ${active ? "text-white" : "text-slate-300"}`}>{chap.title.split(": ")[1]}</h4>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Available Quests</h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{chapterQuests.length} Challenges Found</span>
          </div>

          {chapterQuests.length === 0 ? (
            <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] p-12 text-center">
              <p className="text-slate-500 font-bold italic">Sensei is still preparing quests for this chapter...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {chapterQuests.map((quest) => {
                const completed = getQuestStatus(quest.id);
                return (
                  <div
                    key={quest.id}
                    onClick={() => {
                      setActiveQuest(quest);
                      setView("quest-detail");
                    }}
                    className="group bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:border-indigo-500/50 shadow-sm"
                  >
                    <div className="h-40 relative">
                      <img src={quest.imageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800"} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900" />
                      {completed && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg shadow-emerald-900/40">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <div className="absolute bottom-4 left-6">
                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">Quest {quest.order}</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-white italic">{quest.title}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{quest.topic}</p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Zap size={14} />
                          <span className="text-[10px] font-black uppercase">{quest.rewardPoints} XP</span>
                        </div>
                        <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
              <Trophy className="text-amber-500" size={18} /> Hall of Fame
            </h3>
            <LeaderboardList users={dbUsers} limit={5} highlightId={user.id} />
          </div>

          <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
            <Sparkles className="absolute -top-4 -right-4 text-white opacity-20 w-24 h-24 group-hover:rotate-12 transition-transform" />
            <h3 className="text-white font-black italic text-xl mb-2 relative z-10">Study Tip</h3>
            <p className="text-indigo-100 text-xs font-bold leading-relaxed relative z-10 opacity-90">Ulangi materi yang sudah kamu selesaikan untuk memperkuat ingatanmu. AI Sensei selalu siap membantu!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ dbUsers, dbLevels, onUpdateConfig, onRewardUser, systemConfig, showAlert, loadData, apiStatus, onConnectKey }: any) => {
  const [activeTab, setActiveTab] = useState<"students" | "chapters" | "leaderboard" | "settings">("students");
  const [managedChapterId, setManagedChapterId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(systemConfig.announcement || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [manualKey, setManualKey] = useState(localStorage.getItem("quest8_api_key") || "");
  const [showKey, setShowKey] = useState(false);

  const saveManualKey = () => {
    if (manualKey.length < 10) return showAlert("Kode Akses tidak valid!");
    localStorage.setItem("quest8_api_key", manualKey);
    showAlert("Sensei Berhasil Diaktifkan!");
    setTimeout(() => window.location.reload(), 800);
  };

  const handleBulkGenerate = async (chapter: Chapter) => {
    if (!apiStatus) return showAlert("Sensei sedang offline. Aktifkan di menu Settings!");
    if (!confirm(`Buat ${chapter.totalQuests} quest secara otomatis untuk ${chapter.title}?`)) return;

    setIsGenerating(true);
    showAlert("Sensei sedang merancang kurikulum...");

    try {
      const generatedData = await generateChapterQuests(chapter.id, chapter.title, chapter.totalQuests, 5);

      for (let i = 0; i < generatedData.length; i++) {
        const qData = generatedData[i];
        await dbService.saveQuest({
          id: `q_${chapter.id}_${i}_${Date.now()}`,
          chapterId: chapter.id,
          chapterTitle: chapter.title.split(": ")[1],
          order: i + 1,
          title: qData.title || `Quest ${i + 1}`,
          topic: qData.topic || "English Lesson",
          passingScore: 80,
          rewardPoints: qData.rewardPoints || 150,
          imageUrl: "",
          content: qData.content || [],
          questions: qData.questions || [],
          status: "draft",
        } as Quest);
      }

      showAlert("Berhasil! Quest telah dibuat sebagai draf.");
      await loadData();
    } catch (e: any) {
      console.error(e);
      showAlert("Gagal membuat materi. Mohon periksa kembali Kode Akses Sensei.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleChapterStatus = async (chapterId: string, publish: boolean) => {
    const questsToUpdate = dbLevels.filter((q: any) => q.chapterId === chapterId);
    try {
      await Promise.all(questsToUpdate.map((q: any) => dbService.saveQuest({ ...q, status: publish ? "published" : "draft" })));
      showAlert(`Bab ${publish ? "Berhasil Dipublikasi" : "Kembali ke Draf"}.`);
      await loadData();
    } catch (e) {
      showAlert("Gagal memperbarui status.");
    }
  };

  if (managedChapterId) {
    const quests = dbLevels.filter((q: any) => q.chapterId === managedChapterId);
    return (
      <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-6">
        <button onClick={() => setManagedChapterId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
          <ChevronLeft size={16} /> Kembali
        </button>
        <div className="grid grid-cols-1 gap-3">
          {quests.map((q: any) => (
            <div key={q.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center font-black text-indigo-400 border border-slate-800">{q.order}</div>
                <div>
                  <h4 className="font-black text-white italic">{q.title}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{q.topic}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm("Hapus quest ini?")) {
                      await dbService.deleteQuest(q.id);
                      await loadData();
                    }
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-950/30 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <h2 className="text-4xl font-black uppercase italic text-white">Teacher Terminal</h2>
        <div className="flex bg-slate-900 p-2 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
          {["students", "chapters", "leaderboard", "settings"].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-500"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "students" && (
        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-8 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
              <tr className="pb-4">
                <th>Nama</th>
                <th className="text-center">XP</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dbUsers
                .filter((u: any) => u.role === UserRole.STUDENT)
                .map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-950/30">
                    <td className="py-5 font-bold">{s.name}</td>
                    <td className="text-center text-indigo-400 font-black">{s.xp}</td>
                    <td className="text-right">
                      <button onClick={() => onRewardUser(s.id, 100)} className="p-2 text-amber-500" title="Beri Hadiah">
                        <Gift size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "chapters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {isGenerating && (
            <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-[3rem]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="text-xs font-black uppercase text-white animate-pulse">Sensei Sedang Bekerja...</p>
              </div>
            </div>
          )}
          {CHAPTERS.map((chap) => {
            const chapQuests = dbLevels.filter((q: any) => q.chapterId === chap.id);
            const isPublished = chapQuests.length > 0 && chapQuests.every((q: any) => q.status === "published");
            return (
              <div key={chap.id} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Layers size={24} />
                    </div>
                    <button onClick={() => toggleChapterStatus(chap.id, !isPublished)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${isPublished ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"}`}>
                      {isPublished ? "Tarik Publikasi" : "Publikasikan Bab"}
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-white italic">{chap.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-2">
                    {chapQuests.length} / {chap.totalQuests} Quest tersedia.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <button
                    onClick={() => handleBulkGenerate(chap)}
                    disabled={isGenerating || chapQuests.length >= chap.totalQuests}
                    className="w-full py-4 bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> {chapQuests.length >= chap.totalQuests ? "Kurikulum Lengkap" : "Buat Materi Otomatis"}
                  </button>
                  <button onClick={() => setManagedChapterId(chap.id)} className="w-full py-4 bg-slate-950 text-slate-400 border border-slate-800 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                    <Settings2 size={16} /> Kelola Quest
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="max-w-2xl mx-auto bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
          <h3 className="text-2xl font-black text-white italic mb-8 uppercase flex items-center gap-3">
            <Trophy className="text-amber-500" /> Peringkat Kelas
          </h3>
          <LeaderboardList users={dbUsers} />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-xl mx-auto space-y-6 pb-20">
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" /> Konfigurasi Mesin
              </h3>
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${apiStatus ? "bg-emerald-950 text-emerald-500 border-emerald-900" : "bg-rose-950 text-rose-500 border-rose-900"}`}
              >
                {apiStatus ? <Wifi size={12} /> : <WifiOff size={12} />} {apiStatus ? "Online" : "Offline"}
              </div>
            </div>

            <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Key size={14} /> Tempel Kode Akses Sensei Disini
                  </p>
                  <button onClick={() => setShowKey(!showKey)} className="text-slate-500 hover:text-white transition-colors">
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative group">
                  <textarea
                    rows={2}
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value.trim())}
                    placeholder="Paste Kode AIzaSy... disini"
                    className="w-full bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl text-white text-sm outline-none focus:border-indigo-600 transition-all font-mono resize-none shadow-inner"
                  />
                </div>

                <button
                  onClick={saveManualKey}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                >
                  <ClipboardCheck size={20} /> Simpan & Aktifkan Sensei
                </button>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <div className="h-[1px] bg-slate-800 w-full" />
                <div className="flex flex-col gap-3">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-900/20 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 transition-all"
                  >
                    <Globe size={16} /> Belum Punya Kode? Klik Disini
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6">
            <h3 className="text-xl font-black text-white uppercase italic">Pusat Pengumuman</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full h-40 p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none focus:border-indigo-500 transition-colors"
              placeholder="Tulis pesan untuk siswa..."
            />
            <button onClick={() => onUpdateConfig({ announcement })} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-900/20">
              Perbarui Pengumuman
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("quest8_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState("login");
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbLevels, setDbLevels] = useState<Quest[]>([]);
  const [dbProgress, setDbProgress] = useState<Progress[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ semester: "1", year: "2024/2025", maintenance: false, announcement: "Selamat datang di Quest8 LMS!" });
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [showMobileReference, setShowMobileReference] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "", name: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("quest8_user", JSON.stringify(user));
      setView("dashboard");
    } else {
      localStorage.removeItem("quest8_user");
      setView("login");
    }
  }, [user]);

  const showAlert = useCallback((msg: string) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const checkApiStatus = useCallback(async () => {
    try {
      const manualKey = localStorage.getItem("quest8_api_key");
      if (manualKey && manualKey.length > 10) {
        setApiStatus(true);
      } else if (process.env.API_KEY && process.env.API_KEY.length > 10) {
        setApiStatus(true);
      } else {
        setApiStatus(false);
      }
    } catch (e) {
      setApiStatus(false);
    }
  }, []);

  const handleConnectKey = async () => {
    showAlert("Gunakan Kotak Input di menu SETTINGS!");
  };

  const loadData = useCallback(async () => {
    try {
      const [users, quests, progress, config] = await Promise.all([dbService.getUsers(), dbService.getQuests(), dbService.getProgress(), dbService.getConfig()]);
      if (users.length === 0) {
        for (const u of DEFAULT_USERS) await dbService.saveUser(u);
        setDbUsers(DEFAULT_USERS);
      } else setDbUsers(users);
      if (quests.length === 0) {
        for (const q of INITIAL_CURRICULUM) await dbService.saveQuest(q);
        setDbLevels(INITIAL_CURRICULUM);
      } else setDbLevels(quests);
      setDbProgress(progress);
      if (config) setSystemConfig(config);

      await checkApiStatus();
    } catch (e) {
      console.error("Load failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, [checkApiStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) return showAlert("Harap isi username dan password!");
    const found = dbUsers.find((u) => u.username === loginForm.username && u.password === loginForm.password);
    if (found) {
      setUser(found);
    } else {
      showAlert("Username/Password salah!");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password || !loginForm.name) return showAlert("Harap isi semua bidang!");
    const exists = dbUsers.find((u) => u.username === loginForm.username);
    if (exists) return showAlert("Username sudah digunakan!");

    const newUser: User = {
      id: `u_${Date.now()}`,
      username: loginForm.username,
      password: loginForm.password,
      name: loginForm.name,
      role: UserRole.STUDENT,
      xp: 0,
      streak: 0,
      unlockedChapters: ["bab1"],
    };

    try {
      await dbService.saveUser(newUser);
      setDbUsers((p) => [...p, newUser]);
      setUser(newUser);
      showAlert("Berhasil terdaftar!");
    } catch (e) {
      showAlert("Gagal pendaftaran.");
    }
  };

  const onQuizFinish = async (score: number) => {
    if (!user || !activeQuest) return;

    if (score >= activeQuest.passingScore) {
      const already = dbProgress.some((p) => p.userId === user.id && p.levelId === activeQuest.id);

      if (!already) {
        // 1. Simpan Progres Kuis Baru
        const newProgress = { userId: user.id, levelId: activeQuest.id, score, completedAt: new Date().toISOString() };
        await dbService.saveProgress(newProgress);

        // 2. Siapkan data update user (XP)
        let updatedUnlockedChapters = [...(user.unlockedChapters || ["bab1"])];

        // 3. Jembatan Akses: Cek apakah Bab berikutnya harus dibuka
        // Ambil semua quest bab ini yang berstatus 'published'
        const publishedQuestsInChapter = dbLevels.filter((q) => q.chapterId === activeQuest.chapterId && q.status === "published");
        // Ambil progres siswa untuk bab ini (termasuk yang baru saja selesai)
        const completedQuestIds = new Set([...dbProgress.filter((p) => p.userId === user.id).map((p) => p.levelId), activeQuest.id]);

        // Cek apakah semua quest di bab ini sudah selesai
        const isChapterComplete = publishedQuestsInChapter.every((q) => completedQuestIds.has(q.id));

        if (isChapterComplete) {
          // Cari index bab saat ini di konstanta CHAPTERS
          const currentChapIdx = CHAPTERS.findIndex((c) => c.id === activeQuest.chapterId);
          if (currentChapIdx !== -1 && currentChapIdx < CHAPTERS.length - 1) {
            const nextChapter = CHAPTERS[currentChapIdx + 1];
            if (!updatedUnlockedChapters.includes(nextChapter.id)) {
              updatedUnlockedChapters.push(nextChapter.id);
              showAlert(`🎉 Selamat! Bab ${nextChapter.order} Berhasil Terbuka!`);
            }
          }
        }

        const updatedUser = {
          ...user,
          xp: user.xp + activeQuest.rewardPoints,
          unlockedChapters: updatedUnlockedChapters,
        };

        await dbService.saveUser(updatedUser);
        setUser(updatedUser);
        await loadData();
      }
    }
    setIsQuizMode(false);
    setView("dashboard");
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-indigo-400 animate-pulse">Entering Realm...</p>
      </div>
    );

  if (view === "login")
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl rotate-12">Q</div>
            <h1 className="text-4xl font-black text-white italic">Quest8 LMS</h1>
          </div>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-6">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Full Name</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-600 transition-colors"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Username</label>
              <input
                type="text"
                placeholder="Username"
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-600 transition-colors"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-600 transition-colors"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-900/40">
              {isRegistering ? "Create Account" : "Enter the Realm"}
            </button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors">
              {isRegistering ? "Sudah punya akun? Masuk" : "Daftar Siswa Baru"}
            </button>
          </form>
          {alert && <div className="bg-rose-950/50 border border-rose-900/50 p-4 rounded-2xl text-rose-400 font-bold text-center animate-in fade-in slide-in-from-top-2">{alert}</div>}
        </div>
      </div>
    );

  return (
    <Layout user={user} onLogout={() => setUser(null)} onViewChange={setView} activeView={view}>
      <div className="fixed top-2 right-4 z-[60] md:flex hidden items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
        <div className={`w-2 h-2 rounded-full ${apiStatus ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AI Status: {apiStatus ? "Active" : "Offline"}</span>
      </div>

      {view === "dashboard" && user?.role === UserRole.STUDENT && (
        <StudentDashboard user={user} dbUsers={dbUsers} dbProgress={dbProgress} dbLevels={dbLevels} setActiveQuest={setActiveQuest} setView={setView} setIsQuizMode={setIsQuizMode} />
      )}
      {view === "dashboard" && user?.role !== UserRole.STUDENT && (
        <TeacherDashboard
          dbUsers={dbUsers}
          dbLevels={dbLevels}
          onUpdateConfig={async (c: any) => {
            await dbService.saveConfig({ ...systemConfig, ...c });
            setSystemConfig({ ...systemConfig, ...c });
          }}
          onRewardUser={async (id: string, p: number) => {
            const s = dbUsers.find((u) => u.id === id);
            if (s) {
              await dbService.saveUser({ ...s, xp: s.xp + p });
              await loadData();
            }
          }}
          systemConfig={systemConfig}
          showAlert={showAlert}
          loadData={loadData}
          apiStatus={apiStatus}
          onConnectKey={handleConnectKey}
        />
      )}

      {view === "quest-detail" && activeQuest && (
        <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6">
          {!isQuizMode ? (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
              <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                <ChevronLeft size={16} /> Back
              </button>
              <div className="relative h-72 md:h-[400px] rounded-[3rem] md:rounded-[4rem] overflow-hidden border-8 border-slate-900 shadow-2xl">
                <img src={activeQuest.imageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800"} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950" />
                <div className="absolute bottom-0 left-0 p-12">
                  <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">{activeQuest.title}</h2>
                </div>
              </div>
              <div className="bg-slate-900 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-slate-800">
                <ContentRenderer content={activeQuest.content} />
                <div className="mt-16 pt-12 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex gap-10">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Rewards</p>
                      <p className="text-xl font-black text-white">{activeQuest.rewardPoints} XP</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsQuizMode(true)}
                    className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition-all"
                  >
                    Start Challenge <Zap size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
              <div className="hidden md:block md:col-span-4 sticky top-24 bg-slate-900 p-8 rounded-[3rem] border border-slate-800 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                  <BookOpen className="text-indigo-400" size={24} />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Study Reference</h3>
                </div>
                <ContentRenderer content={activeQuest.content} compact />
              </div>
              <div className="md:hidden fixed bottom-32 left-6 z-50">
                <button
                  onClick={() => setShowMobileReference(!showMobileReference)}
                  className="w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-emerald-500"
                >
                  {showMobileReference ? <X size={24} /> : <BookOpen size={24} />}
                </button>
                {showMobileReference && (
                  <div className="fixed inset-x-6 bottom-52 bg-slate-900 border-2 border-indigo-500 rounded-[2rem] p-6 shadow-2xl max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Reference</span>
                      <button onClick={() => setShowMobileReference(false)}>
                        <X size={16} className="text-slate-500" />
                      </button>
                    </div>
                    <ContentRenderer content={activeQuest.content} compact />
                  </div>
                )}
              </div>
              <div className="md:col-span-8 w-full max-w-2xl mx-auto space-y-6">
                <div className="md:hidden bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Eye size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Materi ada di tombol hijau</span>
                  </div>
                </div>
                <QuizEngine questions={activeQuest.questions} passingScore={activeQuest.passingScore} onFinish={onQuizFinish} />
              </div>
            </div>
          )}
        </div>
      )}
      <AISensei topic={activeQuest?.topic || "General English"} isOpen={isAiChatOpen} setIsOpen={setIsAiChatOpen} />
      {alert && view !== "login" && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl text-center min-w-[300px]">{alert}</div>
      )}
    </Layout>
  );
};

export default App;
