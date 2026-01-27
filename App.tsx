import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trophy,
  CheckCircle2,
  Users,
  Eye,
  UserPlus,
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  ShieldAlert,
  Trash2,
  Loader2,
  UserCircle2,
  Mail,
  Lock,
  Key,
  Bot,
  Flame,
  Award,
  Clock,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  TrendingUp,
  BookOpen,
  Settings2,
  Plus,
  EyeOff,
  MessageSquare,
  Gift,
  Megaphone,
  Sparkles,
  Image as ImageIcon,
  Map,
  Layers,
  User as UserIcon,
  Globe,
  LockIcon,
  ChevronRight,
} from "lucide-react";
import { INITIAL_CURRICULUM, DEFAULT_USERS, CHAPTERS } from "./constants.tsx";
import { User, UserRole, Quest, Progress, SystemConfig, Chapter, Question } from "./types.ts";
import Layout from "./components/Layout.tsx";
import QuizEngine from "./components/QuizEngine.tsx";
import AISensei from "./components/AISensei.tsx";
import { dbService } from "./services/dbService.ts";
import { generateQuestImage, generateChapterQuests } from "./services/geminiService.ts";

// --- Sub-components (ContentRenderer, StudentDashboard, TeacherDashboard) ---

const ContentRenderer: React.FC<{ content: Quest["content"] }> = ({ content }) => (
  <div className="space-y-8">
    {content.map((item, idx) => {
      if (item.type === "h1")
        return (
          <h1 key={idx} className="text-4xl font-black text-white border-l-8 border-indigo-600 pl-6 uppercase">
            {item.text}
          </h1>
        );
      if (item.type === "h2")
        return (
          <h2 key={idx} className="text-xl font-bold text-indigo-400 uppercase flex items-center gap-3">
            <div className="w-8 h-[2px] bg-indigo-900" />
            {item.text}
          </h2>
        );
      if (item.type === "p")
        return (
          <p key={idx} className="text-slate-300 font-medium leading-relaxed text-lg">
            {item.text}
          </p>
        );
      if (item.type === "list")
        return (
          <ul key={idx} className="space-y-3 bg-slate-900/50 p-8 rounded-[2.5rem] border-2 border-slate-800">
            {item.items?.map((li, i) => (
              <li key={i} className="flex gap-4 text-slate-300 font-bold text-base items-start">
                <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 text-xs border border-indigo-900/50">{i + 1}</div>
                <span>{li}</span>
              </li>
            ))}
          </ul>
        );
      return null;
    })}
  </div>
);

const StudentDashboard = ({ user, dbProgress, dbLevels, dbUsers, setIsAiChatOpen, setActiveQuest, setView, setIsQuizMode, systemConfig }: any) => {
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
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Progress Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-xl shadow-indigo-900/10 space-y-6">
            <div className="text-center">
              <h2 className="text-5xl font-black text-white italic">
                {user.xp} <span className="text-xs text-indigo-400 uppercase tracking-widest block not-italic mt-1">Total XP Earned</span>
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

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-4">World Map</h3>
            {CHAPTERS.map((chap) => {
              const unlocked = isChapterUnlocked(chap.id);
              const active = activeChapterId === chap.id;
              return (
                <button
                  key={chap.id}
                  onClick={() => unlocked && setActiveChapterId(chap.id)}
                  className={`w-full p-5 rounded-[2rem] border transition-all text-left flex items-center gap-4 group ${
                    active
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-900/20"
                      : unlocked
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-indigo-600/50"
                        : "bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed grayscale"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${active ? "bg-indigo-700 border-indigo-400" : "bg-slate-950 border-slate-800"}`}>{unlocked ? <Map size={18} /> : <Lock size={18} />}</div>
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${active ? "text-indigo-200" : "text-slate-500"}`}>Chapter {chap.order}</p>
                    <p className="text-sm font-black italic">{chap.title.split(": ")[1]}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quest List */}
        <div className="flex-1 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-black uppercase text-white italic mb-2">{CHAPTERS.find((c) => c.id === activeChapterId)?.title}</h2>
              <p className="text-slate-400 font-bold max-w-xl">{CHAPTERS.find((c) => c.id === activeChapterId)?.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentChapterQuests.length > 0 ? (
              currentChapterQuests.map((lvl: any, idx: number) => {
                const isDone = completedQuestIds.includes(lvl.id);
                const isLocked = idx > 0 && !completedQuestIds.includes(currentChapterQuests[idx - 1].id);
                return (
                  <div
                    key={lvl.id}
                    onClick={() => !isLocked && (setActiveQuest(lvl), setView("quest-detail"), setIsQuizMode(false))}
                    className={`relative h-64 rounded-[3rem] overflow-hidden cursor-pointer group border-4 transition-all ${
                      isDone ? "border-emerald-500/30" : isLocked ? "border-slate-900 opacity-40 grayscale pointer-events-none" : "border-slate-800 hover:border-indigo-600 shadow-xl"
                    }`}
                  >
                    <img src={lvl.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10">Quest {lvl.order}</span>
                        {isDone && (
                          <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">{lvl.topic}</p>
                        <h3 className="text-2xl font-black uppercase text-white italic">{lvl.title}</h3>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-950/50 rounded-[3rem] border-2 border-dashed border-slate-800">
                <Bot size={48} className="mx-auto mb-4 text-slate-700" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-600">Chapter content has not been published yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ dbUsers, dbProgress, dbLevels, onUpdateQuest, onUpdateConfig, onRewardUser, onGenerateImage, systemConfig, showAlert }: any) => {
  const [activeTab, setActiveTab] = useState<"students" | "chapters" | "settings">("students");
  const [managedChapterId, setManagedChapterId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(systemConfig.announcement || "");
  const [generatingChapter, setGeneratingChapter] = useState<string | null>(null);

  const handleBulkGenerate = async (chapter: Chapter) => {
    if (!confirm(`Generate ${chapter.totalQuests} AI Quests for ${chapter.title}? \n\nNote: Ini mungkin memakan waktu 1-2 menit karena AI sedang merancang kurikulum lengkap.`)) return;

    setGeneratingChapter(chapter.id);
    showAlert("AI Sensei is designing the curriculum... Please wait.");

    try {
      const generatedData = await generateChapterQuests(chapter.id, chapter.title, chapter.totalQuests);

      if (!generatedData || generatedData.length === 0) {
        throw new Error("AI returned no data.");
      }

      for (let i = 0; i < generatedData.length; i++) {
        const qData = generatedData[i];

        // Transform the AI output to our Quest structure
        const fullQuest: Quest = {
          id: `q_${chapter.id}_${i}_${Date.now()}`,
          chapterId: chapter.id,
          chapterTitle: chapter.title.split(": ")[1],
          order: i + 1,
          title: qData.title || `Quest ${i + 1}`,
          topic: qData.topic || "General Mastery",
          passingScore: 80,
          rewardPoints: qData.rewardPoints || 150,
          imageUrl: "", // Initial empty, will update below
          content: qData.content || [],
          questions: (qData.questions || []).map((ques: any) => ({
            ...ques,
            correct: typeof ques.correct === "number" ? ques.correct : ques.correct === true ? 1 : 0,
          })),
          status: "draft",
        };

        await dbService.saveQuest(fullQuest);
      }

      showAlert("Success! Curriculum generated in Draft mode.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      console.error(e);
      showAlert(`Generation failed: ${e.message || "Unknown error"}. Try again.`);
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
      <div className="max-w-7xl mx-auto py-12 px-6 space-y-8 animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => setManagedChapterId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors">
          <ChevronLeft size={16} /> Back to Chapters
        </button>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-white italic">{chapter?.title}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Quest Manager ({quests.length} quests)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {quests.map((q: any) => (
            <div key={q.id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
              <div className="flex items-center gap-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-black ${q.status === "published" ? "bg-emerald-950 border-emerald-500/30 text-emerald-500" : "bg-slate-950 border-slate-800 text-slate-600"}`}
                >
                  {q.order}
                </div>
                <div>
                  <h4 className="font-black text-white italic">{q.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{q.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleQuestStatus(q)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${q.status === "published" ? "bg-indigo-950 text-indigo-400 border border-indigo-900/50" : "bg-slate-950 text-slate-400 border border-slate-800"}`}
                >
                  {q.status === "published" ? <Globe size={14} /> : <LockIcon size={14} />}
                  {q.status === "published" ? "Published" : "Draft"}
                </button>
                <button onClick={() => deleteQuest(q.id)} className="p-3 bg-slate-950 text-slate-500 hover:text-rose-500 rounded-xl border border-slate-800 hover:border-rose-900/50 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {quests.length === 0 && (
            <div className="py-20 text-center bg-slate-950/50 rounded-[3rem] border-2 border-dashed border-slate-800">
              <Bot size={48} className="mx-auto mb-4 text-slate-700" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-600">No quests generated for this chapter yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black uppercase italic text-white">
            Teacher <span className="text-indigo-600">Terminal</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase mt-2">Classroom Orchestration</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          {["students", "chapters", "settings"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "students" && (
        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-10">
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
      )}

      {activeTab === "chapters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CHAPTERS.map((chap) => {
            const chapQuests = dbLevels.filter((q: any) => q.chapterId === chap.id);
            const isPublished = chapQuests.length > 0 && chapQuests.every((q: any) => q.status === "published");
            const hasDrafts = chapQuests.some((q: any) => q.status === "draft");

            return (
              <div key={chap.id} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between group hover:border-indigo-600/30 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-900/50">
                      <Layers size={24} />
                    </div>
                    <div className="flex gap-2">
                      {chapQuests.length > 0 && (
                        <button
                          onClick={() => toggleChapterStatus(chap.id, !isPublished)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isPublished ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"}`}
                        >
                          {isPublished ? "Set Draft" : "Publish All"}
                        </button>
                      )}
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isPublished ? "bg-emerald-500 text-white" : hasDrafts ? "bg-amber-900 text-amber-400" : "bg-slate-950 text-slate-500"}`}>
                        {isPublished ? "Online" : hasDrafts ? "Partial" : "Empty"}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white italic">{chap.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-2">
                    {chapQuests.length} Quests created out of {chap.totalQuests} syllabus points.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex flex-col gap-3">
                  {chapQuests.length < chap.totalQuests && (
                    <button
                      onClick={() => handleBulkGenerate(chap)}
                      disabled={generatingChapter === chap.id}
                      className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {generatingChapter === chap.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Auto-Generate Full Chapter Quests
                    </button>
                  )}
                  <button
                    onClick={() => setManagedChapterId(chap.id)}
                    className="w-full py-4 bg-slate-950 text-slate-400 border border-slate-800 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:text-white hover:border-slate-600 transition-all"
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
        <div className="max-w-xl mx-auto space-y-8">
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-xl font-black text-white italic">Broadcast Center</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full h-40 p-6 bg-slate-950 border border-slate-800 rounded-3xl text-white outline-none focus:border-indigo-600 transition-all resize-none"
              placeholder="Message to students..."
            />
            <button onClick={() => onUpdateConfig({ announcement })} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs">
              Update Announcement
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbLevels, setDbLevels] = useState<Quest[]>([]);
  const [dbProgress, setDbProgress] = useState<Progress[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ semester: "2", year: "2025/2026", maintenance: false });

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("dashboard");
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const showAlert = useCallback((text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 4000);
  }, []);

  const initApp = useCallback(async () => {
    try {
      setLoading(true);
      let fetchedUsers = await dbService.getUsers();
      let fetchedQuests = await dbService.getQuests();
      let fetchedProgress = await dbService.getProgress();
      let fetchedConfig = await dbService.getConfig();

      // Ensure Admin & Teacher exist and have correct names from constants
      for (const defaultU of DEFAULT_USERS) {
        const existing = fetchedUsers.find((u) => u.username === defaultU.username);
        if (!existing || existing.name !== defaultU.name) {
          await dbService.saveUser(defaultU);
          if (!existing) {
            fetchedUsers.push(defaultU);
          } else {
            const idx = fetchedUsers.findIndex((u) => u.username === defaultU.username);
            fetchedUsers[idx] = { ...existing, name: defaultU.name };
          }
        }
      }

      if (fetchedQuests.length === 0) {
        for (const q of INITIAL_CURRICULUM) {
          const fullQ: Quest = { ...q, status: "published" };
          await dbService.saveQuest(fullQ);
        }
        fetchedQuests = INITIAL_CURRICULUM.map((q) => ({ ...q, status: "published" as const }));
      }

      if (!fetchedConfig) {
        const defaultConfig = { semester: "2", year: "2025/2026", maintenance: false, announcement: "Welcome to Quest8 LMS!" };
        await dbService.saveConfig(defaultConfig);
        fetchedConfig = defaultConfig;
      }

      setDbUsers(fetchedUsers);
      setDbLevels(fetchedQuests);
      setDbProgress(fetchedProgress);
      setSystemConfig(fetchedConfig);
    } catch (err: any) {
      console.error(err);
      showAlert("Sync Failed! Check connection.");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string).toLowerCase().trim();
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (isRegistering) {
      if (dbUsers.some((u) => u.username === username)) return showAlert("Username already taken!");
      const newUser: User = {
        id: `u_${Date.now()}`,
        username,
        password,
        name,
        role: UserRole.STUDENT,
        xp: 0,
        streak: 0,
        unlockedChapters: ["bab1"],
      };
      await dbService.saveUser(newUser);
      setDbUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      setIsRegistering(false);
      showAlert(`Welcome, ${name}!`);
    } else {
      const found = dbUsers.find((u) => u.username === username && u.password === password);
      if (found) {
        if (systemConfig.maintenance && found.role !== UserRole.ADMIN) return showAlert("Maintenance Mode.");
        setUser(found);
      } else {
        showAlert("Invalid username or password.");
      }
    }
  };

  const handleQuestComplete = useCallback(
    async (questId: string, score: number, points: number) => {
      if (!user) return;
      const newProgress: Progress = { userId: user.id, levelId: questId, score, completedAt: new Date().toISOString() };
      try {
        await dbService.saveProgress(newProgress);
        setDbProgress((prev) => [...prev.filter((p) => !(p.userId === user.id && p.levelId === questId)), newProgress]);
        if (score >= 80) {
          const updatedUser = { ...user, xp: user.xp + points };
          await dbService.saveUser(updatedUser);
          setDbUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
          setUser(updatedUser);
          showAlert(`Clear! +${points} XP.`);
        }
      } catch (err) {
        showAlert("Save Failed.");
      }
    },
    [user, showAlert],
  );

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] flex items-center justify-center shadow-2xl animate-pulse-slow">
          <span className="text-6xl font-black italic">Q</span>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Initializing Syllabus...</p>
      </div>
    );

  return (
    <Layout
      user={user}
      onLogout={() => {
        setUser(null);
        setView("dashboard");
      }}
      onViewChange={setView}
      activeView={view}
    >
      {msg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 px-8 py-4 rounded-full border border-indigo-500/50 text-white font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-10">
          {msg}
        </div>
      )}

      {!user ? (
        <div className="min-h-[90vh] flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md bg-slate-900 p-10 md:p-12 rounded-[4rem] border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl rotate-3">Q</div>
              <h2 className="text-3xl font-black uppercase text-white italic">Quest8 Academy</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{isRegistering ? "Initialize Adventurer" : "Adventurer Login"}</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <input name="name" type="text" placeholder="Full Name" required className="w-full px-8 py-5 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none transition-all" />
              )}
              <div className="relative">
                <input name="username" type="text" placeholder="Username" required className="w-full px-8 py-5 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none transition-all" />
                <UserIcon className="absolute right-6 top-5 text-slate-700" size={20} />
              </div>
              <div className="relative">
                <input name="password" type="password" placeholder="Password" required className="w-full px-8 py-5 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none transition-all" />
                <Lock className="absolute right-6 top-5 text-slate-700" size={20} />
              </div>
              <button className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">
                {isRegistering ? "Start My Journey" : "Enter The Hub"}
              </button>
            </form>
            <div className="text-center pt-4">
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">
                {isRegistering ? "Already have an account? Login" : "New Adventurer? Create Account"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {view === "quest-detail" && activeQuest ? (
            <div className="max-w-5xl mx-auto py-12 px-6 pb-32">
              <button onClick={() => setView("dashboard")} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 mb-8 transition-colors">
                <ChevronLeft size={18} /> Back to Map
              </button>
              <div className="bg-slate-900 rounded-[4rem] border border-slate-800 shadow-2xl overflow-hidden">
                <div className="h-96 relative">
                  <img src={activeQuest.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-12 left-12">
                    <h3 className="text-5xl font-black uppercase text-white italic">{activeQuest.topic}</h3>
                  </div>
                </div>
                <div className="p-8 md:p-16">
                  {isQuizMode ? (
                    <QuizEngine
                      questions={activeQuest.questions}
                      passingScore={activeQuest.passingScore}
                      onFinish={(s) => {
                        handleQuestComplete(activeQuest.id, s, s >= activeQuest.passingScore ? activeQuest.rewardPoints : 0);
                        setView("dashboard");
                      }}
                    />
                  ) : (
                    <div className="space-y-12">
                      <ContentRenderer content={activeQuest.content} />
                      <button
                        onClick={() => setIsQuizMode(true)}
                        className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black uppercase text-lg flex items-center justify-center gap-4 hover:bg-indigo-700 active:scale-95 transition-all"
                      >
                        Start Quest Challenge <ArrowRight size={24} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : user.role === UserRole.TEACHER ? (
            <TeacherDashboard
              dbUsers={dbUsers}
              dbProgress={dbProgress}
              dbLevels={dbLevels}
              onUpdateConfig={async (u: any) => {
                await dbService.saveConfig({ ...systemConfig, ...u });
                setSystemConfig({ ...systemConfig, ...u });
                showAlert("Updated.");
              }}
              onRewardUser={async (uid: string, p: number) => {
                const t = dbUsers.find((u) => u.id === uid);
                if (t) {
                  const up = { ...t, xp: t.xp + p };
                  await dbService.saveUser(up);
                  setDbUsers((prev) => prev.map((u) => (u.id === uid ? up : u)));
                  showAlert("Rewarded!");
                }
              }}
              systemConfig={systemConfig}
              showAlert={showAlert}
            />
          ) : (
            <StudentDashboard
              user={user}
              dbProgress={dbProgress}
              dbLevels={dbLevels}
              dbUsers={dbUsers}
              setIsAiChatOpen={setIsAiChatOpen}
              setActiveQuest={setActiveQuest}
              setView={setView}
              setIsQuizMode={setIsQuizMode}
              systemConfig={systemConfig}
            />
          )}

          {user.role === UserRole.STUDENT && <AISensei topic={activeQuest?.topic || "English"} isOpen={isAiChatOpen} setIsOpen={setIsAiChatOpen} />}
        </>
      )}
    </Layout>
  );
}
