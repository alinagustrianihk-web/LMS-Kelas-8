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
} from "lucide-react";
import { INITIAL_CURRICULUM, DEFAULT_USERS, CHAPTERS } from "./constants.tsx";
import { User, UserRole, Quest, Progress, SystemConfig, Chapter } from "./types.ts";
import Layout from "./components/Layout.tsx";
import QuizEngine from "./components/QuizEngine.tsx";
import AISensei from "./components/AISensei.tsx";
import { dbService } from "./services/dbService.ts";
import { generateQuestImage, generateChapterQuests } from "./services/geminiService.ts";

// --- Sub-components (ContentRenderer, LeaderboardList, StudentDashboard, TeacherDashboard) ---

const ContentRenderer: React.FC<{ content: Quest["content"] }> = ({ content }) => (
  <div className="space-y-6 md:space-y-8">
    {content.map((item, idx) => {
      if (item.type === "h1")
        return (
          <h1 key={idx} className="text-2xl md:text-4xl font-black text-white border-l-4 md:border-l-8 border-indigo-600 pl-4 md:pl-6 uppercase">
            {item.text}
          </h1>
        );
      if (item.type === "h2")
        return (
          <h2 key={idx} className="text-lg md:text-xl font-bold text-indigo-400 uppercase flex items-center gap-3">
            <div className="w-6 md:w-8 h-[2px] bg-indigo-900" />
            {item.text}
          </h2>
        );
      if (item.type === "p")
        return (
          <p key={idx} className="text-slate-300 font-medium leading-relaxed text-base md:text-lg">
            {item.text}
          </p>
        );
      if (item.type === "list")
        return (
          <ul key={idx} className="space-y-3 bg-slate-900/50 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-800">
            {item.items?.map((li, i) => (
              <li key={i} className="flex gap-3 md:gap-4 text-slate-300 font-bold text-sm md:text-base items-start">
                <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 text-[10px] border border-indigo-900/50">{i + 1}</div>
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
  const students = users
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

const StudentDashboard = ({ user, dbUsers, dbProgress, dbLevels, setActiveQuest, setView, setIsQuizMode }: any) => {
  const [activeChapterId, setActiveChapterId] = useState("bab1");

  const publishedQuests = dbLevels.filter((l: any) => l.status === "published");
  const completedQuestIds = dbProgress.filter((p: any) => p.userId === user.id).map((p: any) => p.levelId);

  const currentChapterQuests = publishedQuests.filter((q: any) => q.chapterId === activeChapterId);
  const progressPercent = publishedQuests.length > 0 ? (completedQuestIds.length / publishedQuests.length) * 100 : 0;

  const isChapterUnlocked = (chapterId: string) => {
    if (chapterId === "bab1") return true;
    const chapIndex = CHAPTERS.findIndex((c) => c.id === chapterId);
    if (chapIndex <= 0) return false;
    const prevChap = CHAPTERS[chapIndex - 1];
    const prevChapQuests = publishedQuests.filter((q: any) => q.chapterId === prevChap.id);
    if (prevChapQuests.length === 0) return false;
    const finalQuestOfPrev = prevChapQuests[prevChapQuests.length - 1];
    return finalQuestOfPrev && completedQuestIds.includes(finalQuestOfPrev.id);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Progress Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 shadow-xl shadow-indigo-900/10 space-y-6">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-black text-white italic">
                {user.xp} <span className="text-[10px] text-indigo-400 uppercase tracking-widest block not-italic mt-1">Total XP Earned</span>
              </h2>
            </div>
            <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span>Path Progress</span>
              <span className="text-white">{Math.round(progressPercent)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {CHAPTERS.map((chap) => {
              const unlocked = isChapterUnlocked(chap.id);
              const active = activeChapterId === chap.id;
              return (
                <button
                  key={chap.id}
                  onClick={() => unlocked && setActiveChapterId(chap.id)}
                  className={`p-4 md:p-5 rounded-2xl md:rounded-[2rem] border transition-all text-left flex items-center gap-3 md:gap-4 group ${
                    active
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-900/20"
                      : unlocked
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-600/50"
                        : "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed grayscale"
                  }`}
                >
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border ${active ? "bg-indigo-700 border-indigo-400" : "bg-slate-950 border-slate-800"}`}>
                    {unlocked ? <Map size={16} /> : <LockIcon size={16} />}
                  </div>
                  <div className="hidden sm:block lg:block">
                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${active ? "text-indigo-200" : "text-slate-500"}`}>Chapter {chap.order}</p>
                    <p className="text-xs md:text-sm font-black italic line-clamp-1">{chap.title.split(": ")[1]}</p>
                  </div>
                  <div className="sm:hidden lg:hidden">
                    <p className="text-xs font-black italic">Ch. {chap.order}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mini Leaderboard in Sidebar */}
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" /> Top Rankers
              </h3>
            </div>
            <LeaderboardList users={dbUsers} limit={5} highlightId={user.id} />
          </div>
        </div>

        <div className="flex-1 w-full space-y-8">
          <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-black uppercase text-white italic mb-2">{CHAPTERS.find((c) => c.id === activeChapterId)?.title}</h2>
              <p className="text-sm md:text-slate-400 font-bold max-w-xl">{CHAPTERS.find((c) => c.id === activeChapterId)?.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {currentChapterQuests.length > 0 ? (
              currentChapterQuests.map((lvl: any, idx: number) => {
                const isDone = completedQuestIds.includes(lvl.id);
                const isLocked = idx > 0 && !completedQuestIds.includes(currentChapterQuests[idx - 1].id);
                return (
                  <div
                    key={lvl.id}
                    onClick={() => !isLocked && (setActiveQuest(lvl), setView("quest-detail"), setIsQuizMode(false))}
                    className={`relative h-48 md:h-64 rounded-[2rem] md:rounded-[3rem] overflow-hidden cursor-pointer group border-4 transition-all ${
                      isDone ? "border-emerald-500/30" : isLocked ? "border-slate-900 opacity-40 grayscale pointer-events-none" : "border-slate-800 hover:border-indigo-600 shadow-xl"
                    }`}
                  >
                    <img
                      src={lvl.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt={lvl.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white border border-white/10">Quest {lvl.order}</span>
                        {isDone && (
                          <div className="bg-emerald-500 p-1.5 md:p-2 rounded-lg md:rounded-xl text-white shadow-lg">
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">{lvl.topic}</p>
                        <h3 className="text-lg md:text-2xl font-black uppercase text-white italic line-clamp-1">{lvl.title}</h3>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 md:py-20 text-center bg-slate-950/50 rounded-[2.5rem] md:rounded-[3rem] border-2 border-dashed border-slate-800">
                <Bot size={40} className="mx-auto mb-4 text-slate-700" />
                <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-600 px-6">Chapter content has not been published yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ dbUsers, dbLevels, onUpdateConfig, onRewardUser, systemConfig, showAlert }: any) => {
  const [activeTab, setActiveTab] = useState<"students" | "chapters" | "leaderboard" | "settings">("students");
  const [managedChapterId, setManagedChapterId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(systemConfig.announcement || "");
  const [generatingChapter, setGeneratingChapter] = useState<string | null>(null);
  const [teacherApiKey, setTeacherApiKey] = useState("");
  const [questionsPerQuestMap, setQuestionsPerQuestMap] = useState<Record<string, number>>({});

  const getFriendlyErrorMessage = (error: any) => {
    const msg = error?.message || String(error);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return "Kuota Limit Terlampaui (429). Silakan tunggu beberapa menit atau gunakan API Key berbayar Anda sendiri di kolom input.";
    }
    if (msg.includes("API_KEY_INVALID")) {
      return "API Key yang Anda masukkan tidak valid. Periksa kembali.";
    }
    return `Gagal: ${msg.substring(0, 100)}...`;
  };

  const handleBulkGenerate = async (chapter: Chapter) => {
    const qCount = questionsPerQuestMap[chapter.id] || 5;
    if (!confirm(`Generate ${chapter.totalQuests} AI Quests for ${chapter.title} with ${qCount} questions each? \n\nNote: Sistem akan menggunakan Engine AI otomatis.`)) return;

    setGeneratingChapter(chapter.id);
    showAlert("AI Sensei is designing the curriculum...");

    try {
      const generatedData = await generateChapterQuests(chapter.id, chapter.title, chapter.totalQuests, teacherApiKey, qCount);

      if (!generatedData || generatedData.length === 0) {
        throw new Error("AI returned no data.");
      }

      for (let i = 0; i < generatedData.length; i++) {
        const qData = generatedData[i];
        const fullQuest: Quest = {
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
        };
        await dbService.saveQuest(fullQuest);
      }

      showAlert("Success! Check Individual Quests for the drafts.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      console.error(e);
      showAlert(getFriendlyErrorMessage(e));
    } finally {
      setGeneratingChapter(null);
    }
  };

  const toggleChapterStatus = async (chapterId: string, publish: boolean) => {
    const questsToUpdate = dbLevels.filter((q: any) => q.chapterId === chapterId);
    if (questsToUpdate.length === 0) return showAlert("No quests to update.");

    try {
      for (const q of questsToUpdate) {
        await dbService.saveQuest({ ...q, status: publish ? "published" : "draft" });
      }
      showAlert(`Chapter ${publish ? "Published" : "set to Draft"}.`);
      window.location.reload();
    } catch (e) {
      showAlert("Operation failed.");
    }
  };

  const deleteQuest = async (questId: string) => {
    if (!confirm("Are you sure you want to delete this quest?")) return;
    try {
      await dbService.deleteQuest(questId);
      showAlert("Quest deleted.");
      window.location.reload();
    } catch (e) {
      showAlert("Delete failed.");
    }
  };

  const toggleQuestStatus = async (quest: Quest) => {
    try {
      const newStatus = quest.status === "published" ? "draft" : "published";
      await dbService.saveQuest({ ...quest, status: newStatus });
      showAlert(`Quest set to ${newStatus}.`);
      window.location.reload();
    } catch (e) {
      showAlert("Update failed.");
    }
  };

  if (managedChapterId) {
    const chapter = CHAPTERS.find((c) => c.id === managedChapterId);
    const quests = dbLevels.filter((q: any) => q.chapterId === managedChapterId);
    return (
      <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-6 md:space-y-8 animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => setManagedChapterId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors">
          <ChevronLeft size={16} /> Back to Chapters
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-white italic">{chapter?.title}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Quest Manager ({quests.length} quests)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {quests.map((q: any) => (
            <div key={q.id} className="bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-slate-700 transition-all gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border font-black text-sm md:text-base ${q.status === "published" ? "bg-emerald-950 border-emerald-500/30 text-emerald-500" : "bg-slate-950 border-slate-800 text-slate-600"}`}
                >
                  {q.order}
                </div>
                <div>
                  <h4 className="font-black text-white italic text-sm md:text-base">{q.title}</h4>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{q.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                <button
                  onClick={() => toggleQuestStatus(q)}
                  className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${q.status === "published" ? "bg-indigo-950 text-indigo-400 border border-indigo-900/50" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                >
                  {q.status === "published" ? <Globe size={14} /> : <LockIcon size={14} />}
                  {q.status === "published" ? "Published" : "Draft"}
                </button>
                <button onClick={() => deleteQuest(q.id)} className="p-2.5 md:p-3 bg-slate-950 text-slate-500 hover:text-rose-500 rounded-xl border border-slate-800 hover:border-rose-900/50 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {quests.length === 0 && (
            <div className="py-16 md:py-20 text-center bg-slate-950/50 rounded-[2.5rem] md:rounded-[3rem] border-2 border-dashed border-slate-800">
              <Bot size={40} className="mx-auto mb-4 text-slate-700" />
              <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-600">No quests generated for this chapter yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-8 md:space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black uppercase italic text-white">
            Teacher <span className="text-indigo-600">Terminal</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Classroom Orchestration</p>
        </div>
        <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar gap-2 bg-slate-900 p-1.5 md:p-2 rounded-2xl border border-slate-800">
          {["students", "chapters", "leaderboard", "settings"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "students" && (
        <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] border border-slate-800 p-5 md:p-10">
          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {dbUsers
              .filter((u: any) => u.role === UserRole.STUDENT)
              .map((s: any) => (
                <div key={s.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-400 font-black">{s.name.charAt(0)}</div>
                      <div>
                        <p className="text-slate-100 font-bold text-sm">{s.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase">@{s.username}</p>
                      </div>
                    </div>
                    <button onClick={() => onRewardUser(s.id, 100)} className="p-2 bg-slate-900 text-slate-400 hover:text-amber-500 rounded-lg border border-slate-800">
                      <Gift size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Total XP</span>
                    <span className="text-indigo-400">{s.xp} XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "40%" }} />
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-6">Student</th>
                  <th className="pb-6 text-center">XP</th>
                  <th className="pb-6 text-center">Progress</th>
                  <th className="pb-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbUsers
                  .filter((u: any) => u.role === UserRole.STUDENT)
                  .map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-950 transition-colors">
                      <td className="py-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-400 font-black">{s.name.charAt(0)}</div>
                        <div>
                          <p className="text-slate-100 font-bold">{s.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase">@{s.username}</p>
                        </div>
                      </td>
                      <td className="text-center text-indigo-400 font-black">{s.xp}</td>
                      <td className="text-center">
                        <div className="w-24 h-2 bg-slate-950 rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: "40%" }} />
                        </div>
                      </td>
                      <td className="text-right">
                        <button onClick={() => onRewardUser(s.id, 100)} className="p-3 bg-slate-900 text-slate-500 hover:text-amber-500 rounded-xl border border-slate-800 transition-all">
                          <Gift size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="max-w-3xl mx-auto bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/20">
              <Trophy size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white italic uppercase">Class Leaderboard</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Ranking by XP</p>
            </div>
          </div>
          <LeaderboardList users={dbUsers} />
        </div>
      )}

      {activeTab === "chapters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {CHAPTERS.map((chap) => {
            const chapQuests = dbLevels.filter((q: any) => q.chapterId === chap.id);
            const isPublished = chapQuests.length > 0 && chapQuests.every((q: any) => q.status === "published");
            const hasDrafts = chapQuests.some((q: any) => q.status === "draft");
            const qCount = questionsPerQuestMap[chap.id] || 5;
            const isRestricted = chap.order >= 2;

            return (
              <div key={chap.id} className="bg-slate-900 p-7 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between group hover:border-indigo-600/30 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-950 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-900/50">
                      <Layers size={20} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {chapQuests.length > 0 && (
                        <button
                          onClick={() => toggleChapterStatus(chap.id, !isPublished)}
                          className={`px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${isPublished ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"}`}
                        >
                          {isPublished ? "Set Draft" : "Publish All"}
                        </button>
                      )}
                      <span
                        className={`px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isPublished ? "bg-emerald-500 text-white" : hasDrafts ? "bg-amber-900 text-amber-400" : "bg-slate-950 text-slate-500"}`}
                      >
                        {isPublished ? "Online" : hasDrafts ? "Partial" : "Empty"}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white italic">{chap.title}</h3>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-2">
                    {chapQuests.length} Quests created out of {chap.totalQuests} syllabus points.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
                  {/* API Key Input Row */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-1.5">
                        <Key size={10} className="text-indigo-500" />
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Gemini API Key</span>
                      </div>
                      <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-indigo-400 hover:underline underline-offset-2">
                        get API Key here
                      </a>
                    </div>
                    <input
                      type="password"
                      placeholder="Optional: Enter key to bypass limit..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-slate-300 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-700"
                      onChange={(e) => setTeacherApiKey(e.target.value)}
                      value={teacherApiKey}
                    />
                  </div>

                  {/* Question Count Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-1.5">
                        <ListChecks size={10} className="text-indigo-500" />
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Questions Per Quest</span>
                      </div>
                      {isRestricted && <span className="text-[8px] font-bold text-amber-500/70 uppercase">Max 5 (Ch. 2+)</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={isRestricted ? "5" : "15"}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-white focus:border-indigo-600 outline-none transition-all"
                        value={qCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const limit = isRestricted ? 5 : 15;
                          setQuestionsPerQuestMap({ ...questionsPerQuestMap, [chap.id]: isNaN(val) ? 1 : Math.min(Math.max(1, val), limit) });
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setQuestionsPerQuestMap({ ...questionsPerQuestMap, [chap.id]: Math.min(qCount + 1, isRestricted ? 5 : 15) })}
                          className="p-1 bg-slate-950 border border-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                        >
                          <ArrowRight size={10} className="-rotate-90" />
                        </button>
                        <button
                          onClick={() => setQuestionsPerQuestMap({ ...questionsPerQuestMap, [chap.id]: Math.max(qCount - 1, 1) })}
                          className="p-1 bg-slate-950 border border-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                        >
                          <ArrowRight size={10} className="rotate-90" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {chapQuests.length < chap.totalQuests && (
                    <button
                      onClick={() => handleBulkGenerate(chap)}
                      disabled={generatingChapter === chap.id}
                      className="w-full py-3.5 md:py-4 bg-indigo-600 text-white rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {generatingChapter === chap.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Auto-Generate Full Chapter
                    </button>
                  )}
                  <button
                    onClick={() => setManagedChapterId(chap.id)}
                    className="w-full py-3.5 md:py-4 bg-slate-950 text-slate-400 border border-slate-800 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase text-[9px] md:text-[10px] tracking-widest flex items-center justify-center gap-2 hover:text-white hover:border-slate-600 transition-all"
                  >
                    <Settings2 size={16} /> Manage Individual Quests
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
          <div className="bg-slate-900 p-7 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-800 shadow-xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-all">
              <Zap size={100} className="text-indigo-400" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg md:text-xl font-black text-white italic uppercase">AI Sensei Engine</h3>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed mb-6">
                Engine bertenaga Gemini aktif menggunakan kunci sistem dari lingkungan aman. Fitur Auto-Generate Kurikulum dan Tutor AI siap digunakan sepenuhnya.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 p-7 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-lg md:text-xl font-black text-white italic uppercase">Broadcast Center</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full h-32 md:h-40 p-5 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl text-white text-sm outline-none focus:border-indigo-600 transition-all resize-none font-medium"
              placeholder="Message to students..."
            />
            <button onClick={() => onUpdateConfig({ announcement })} className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-2xl md:rounded-3xl font-black uppercase text-[10px] md:text-xs">
              Update Announcement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("login");
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbLevels, setDbLevels] = useState<Quest[]>([]);
  const [dbProgress, setDbProgress] = useState<Progress[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    semester: "1",
    year: "2024/2025",
    maintenance: false,
    announcement: "Selamat datang di Quest8 LMS!",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "", name: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const showAlert = useCallback((msg: string) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await dbService.getUsers();
      const quests = await dbService.getQuests();
      const progress = await dbService.getProgress();
      const config = await dbService.getConfig();

      if (users.length === 0) {
        for (const u of DEFAULT_USERS) await dbService.saveUser(u);
        setDbUsers(DEFAULT_USERS);
      } else {
        setDbUsers(users);
      }

      if (quests.length === 0) {
        for (const q of INITIAL_CURRICULUM) await dbService.saveQuest(q);
        setDbLevels(INITIAL_CURRICULUM);
      } else {
        setDbLevels(quests);
      }

      setDbProgress(progress);
      if (config) setSystemConfig(config);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = dbUsers.find((u) => u.username === loginForm.username && u.password === loginForm.password);
    if (found) {
      setUser(found);
      setView("dashboard");
    } else {
      showAlert("Username atau Password salah!");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password || !loginForm.name) {
      return showAlert("Harap isi semua bidang!");
    }
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
      setDbUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      setView("dashboard");
      showAlert("Pendaftaran Berhasil!");
    } catch (e) {
      showAlert("Pendaftaran Gagal. Coba lagi.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView("login");
    setActiveQuest(null);
    setIsQuizMode(false);
    setIsRegistering(false);
  };

  const onQuizFinish = async (score: number) => {
    if (!user || !activeQuest) return;

    if (score >= activeQuest.passingScore) {
      const newProgress: Progress = {
        userId: user.id,
        levelId: activeQuest.id,
        score,
        completedAt: new Date().toISOString(),
      };

      const alreadyDone = dbProgress.some((p) => p.userId === user.id && p.levelId === activeQuest.id);
      if (!alreadyDone) {
        await dbService.saveProgress(newProgress);
        const updatedUser = { ...user, xp: user.xp + activeQuest.rewardPoints };
        await dbService.saveUser(updatedUser);
        setUser(updatedUser);
        loadData();
      }
    }
    setIsQuizMode(false);
    setView("dashboard");
    setActiveQuest(null);
  };

  const handleUpdateConfig = async (newConfig: Partial<SystemConfig>) => {
    const updated = { ...systemConfig, ...newConfig };
    await dbService.saveConfig(updated);
    setSystemConfig(updated);
    showAlert("Configuration updated!");
  };

  const handleRewardUser = async (userId: string, points: number) => {
    const student = dbUsers.find((u) => u.id === userId);
    if (student) {
      const updated = { ...student, xp: student.xp + points };
      await dbService.saveUser(updated);
      loadData();
      showAlert(`Rewarded ${student.name} with ${points} XP!`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px] md:text-xs animate-pulse">Loading Realm...</p>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]">
        <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white font-black text-3xl md:text-4xl mx-auto shadow-2xl shadow-indigo-900/40 rotate-12 hover:rotate-0 transition-transform cursor-default">
              Q
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic">
                Quest8 <span className="text-indigo-500">LMS</span>
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">English Mastery Platform</p>
            </div>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 shadow-2xl space-y-6">
            <div className="space-y-4">
              {isRegistering && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-4 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    className="w-full pl-12 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-600 transition-all font-bold text-sm"
                    value={loginForm.name}
                    onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                  />
                </div>
              )}
              <div className="relative">
                <UserIcon className="absolute left-4 top-4 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full pl-12 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-600 transition-all font-bold text-sm"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
              </div>
              <div className="relative">
                <LockIcon className="absolute left-4 top-4 text-slate-500" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-indigo-600 transition-all font-bold text-sm"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                className="w-full py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isRegistering ? "Create Account" : "Enter the Realm"}
                {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
              </button>

              <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors">
                {isRegistering ? "Sudah punya akun? Masuk" : "Siswa Baru? Daftar Sekarang"}
              </button>
            </div>
          </form>

          {alert && (
            <div className="bg-rose-950/50 border border-rose-900/50 p-4 rounded-2xl flex items-center gap-3 text-rose-400 font-bold text-sm animate-in slide-in-from-top-4">
              <AlertCircle size={18} /> {alert}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} onViewChange={setView} activeView={view}>
      {view === "dashboard" && user?.role === UserRole.STUDENT && (
        <StudentDashboard user={user} dbUsers={dbUsers} dbProgress={dbProgress} dbLevels={dbLevels} setActiveQuest={setActiveQuest} setView={setView} setIsQuizMode={setIsQuizMode} />
      )}

      {view === "dashboard" && (user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN) && (
        <TeacherDashboard dbUsers={dbUsers} dbLevels={dbLevels} onUpdateConfig={handleUpdateConfig} onRewardUser={handleRewardUser} systemConfig={systemConfig} showAlert={showAlert} />
      )}

      {view === "quest-detail" && activeQuest && (
        <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
          {!isQuizMode ? (
            <div className="space-y-8 md:space-y-12">
              <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors">
                <ChevronLeft size={16} /> Back to Dashboard
              </button>

              <div className="relative h-64 md:h-[400px] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-4 md:border-8 border-slate-900 shadow-2xl">
                <img src={activeQuest.imageUrl || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800"} className="absolute inset-0 w-full h-full object-cover" alt={activeQuest.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-12">
                  <p className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 md:mb-3">{activeQuest.topic}</p>
                  <h2 className="text-2xl md:text-5xl font-black text-white italic uppercase">{activeQuest.title}</h2>
                </div>
              </div>

              <div className="bg-slate-900 p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-800 shadow-xl">
                <ContentRenderer content={activeQuest.content} />

                <div className="mt-10 md:mt-16 pt-8 md:pt-12 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex gap-8 md:gap-10">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Rewards</p>
                      <p className="text-lg md:text-xl font-black text-white">{activeQuest.rewardPoints} XP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Target</p>
                      <p className="text-lg md:text-xl font-black text-white">{activeQuest.passingScore}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsQuizMode(true)}
                    className="w-full md:w-auto px-10 md:px-12 py-5 md:py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl md:rounded-[2rem] font-black uppercase text-xs md:text-sm tracking-[0.2em] shadow-2xl shadow-indigo-900/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
                  >
                    Start Challenge <Zap size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <QuizEngine questions={activeQuest.questions} passingScore={activeQuest.passingScore} onFinish={onQuizFinish} />
            </div>
          )}
        </div>
      )}

      <AISensei topic={activeQuest?.topic || "General English"} isOpen={isAiChatOpen} setIsOpen={setIsAiChatOpen} />

      {alert && view !== "login" && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest text-center shadow-2xl animate-in slide-in-from-top-10 shadow-indigo-900/40">
          {alert}
        </div>
      )}
    </Layout>
  );
};

export default App;
