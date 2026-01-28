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

const StudentDashboard = ({ user, dbUsers, dbProgress, dbLevels, setActiveQuest, setView, setIsQuizMode }: any) => {
  const [activeChapterId, setActiveChapterId] = useState("bab1");

  // Perbaikan: Siswa bisa melihat quest yang berstatus 'published' ATAU yang tidak punya field status (backward compatibility)
  const publishedQuests = dbLevels.filter((l: any) => l.status === "published" || !l.status);
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
                  <div>
                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${active ? "text-indigo-200" : "text-slate-500"}`}>Chapter {chap.order}</p>
                    <p className="text-xs md:text-sm font-black italic line-clamp-1">{chap.title.split(": ")[1]}</p>
                  </div>
                </button>
              );
            })}
          </div>

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

const TeacherDashboard = ({ dbUsers, dbLevels, onUpdateConfig, onRewardUser, systemConfig, showAlert, loadData }: any) => {
  const [activeTab, setActiveTab] = useState<"students" | "chapters" | "leaderboard" | "settings">("students");
  const [managedChapterId, setManagedChapterId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState(systemConfig.announcement || "");
  const [generatingChapter, setGeneratingChapter] = useState<string | null>(null);
  const [teacherApiKey, setTeacherApiKey] = useState("");
  const [questionsPerQuestMap, setQuestionsPerQuestMap] = useState<Record<string, number>>({});

  const handleBulkGenerate = async (chapter: Chapter) => {
    const qCount = questionsPerQuestMap[chapter.id] || 5;
    if (!confirm(`Generate AI Quests for ${chapter.title}?`)) return;

    setGeneratingChapter(chapter.id);
    showAlert("AI Sensei is designing the curriculum...");

    try {
      const generatedData = await generateChapterQuests(chapter.id, chapter.title, chapter.totalQuests, teacherApiKey, qCount);
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
      showAlert("Success! Quests generated as drafts.");
      await loadData();
    } catch (e: any) {
      showAlert("Generation failed.");
    } finally {
      setGeneratingChapter(null);
    }
  };

  const toggleChapterStatus = async (chapterId: string, publish: boolean) => {
    const questsToUpdate = dbLevels.filter((q: any) => q.chapterId === chapterId);
    try {
      // Perbaikan: Gunakan Promise.all untuk kecepatan
      await Promise.all(questsToUpdate.map((q: any) => dbService.saveQuest({ ...q, status: publish ? "published" : "draft" })));
      showAlert(`Chapter ${publish ? "Published" : "Drafted"}.`);
      await loadData();
    } catch (e) {
      showAlert("Status update failed.");
    }
  };

  const toggleQuestStatus = async (quest: Quest) => {
    try {
      const newStatus = quest.status === "published" ? "draft" : "published";
      await dbService.saveQuest({ ...quest, status: newStatus });
      showAlert(`Quest set to ${newStatus}.`);
      await loadData();
    } catch (e) {
      showAlert("Quest update failed.");
    }
  };

  if (managedChapterId) {
    const quests = dbLevels.filter((q: any) => q.chapterId === managedChapterId);
    return (
      <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 space-y-6">
        <button onClick={() => setManagedChapterId(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
          <ChevronLeft size={16} /> Back
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
                  onClick={() => toggleQuestStatus(q)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${q.status === "published" ? "bg-indigo-950 text-indigo-400 border-indigo-900/50" : "bg-slate-950 text-slate-400 border-slate-800"}`}
                >
                  {q.status === "published" ? "Published" : "Draft"}
                </button>
                <button
                  onClick={async () => {
                    if (confirm("Delete?")) {
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
                <th>Name</th>
                <th className="text-center">XP</th>
                <th className="text-right">Action</th>
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
                      <button onClick={() => onRewardUser(s.id, 100)} className="p-2 text-amber-500">
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
            return (
              <div key={chap.id} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-950 rounded-2xl flex items-center justify-center text-indigo-500">
                      <Layers size={24} />
                    </div>
                    <button onClick={() => toggleChapterStatus(chap.id, !isPublished)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${isPublished ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"}`}>
                      {isPublished ? "Unpublish" : "Publish All"}
                    </button>
                  </div>
                  <h3 className="text-2xl font-black text-white italic">{chap.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-2">{chapQuests.length} Quests created.</p>
                </div>
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <input
                    type="password"
                    placeholder="Gemini Key (optional)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-slate-300"
                    onChange={(e) => setTeacherApiKey(e.target.value)}
                    value={teacherApiKey}
                  />
                  <button
                    onClick={() => handleBulkGenerate(chap)}
                    disabled={generatingChapter === chap.id}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2"
                  >
                    {generatingChapter === chap.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate Full Chapter
                  </button>
                  <button onClick={() => setManagedChapterId(chap.id)} className="w-full py-4 bg-slate-950 text-slate-400 border border-slate-800 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                    <Settings2 size={16} /> Manage Quests
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
            <Trophy className="text-amber-500" /> Class Ranking
          </h3>
          <LeaderboardList users={dbUsers} />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6">
          <h3 className="text-xl font-black text-white uppercase italic">Broadcast Center</h3>
          <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} className="w-full h-40 p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm outline-none" placeholder="Message..." />
          <button onClick={() => onUpdateConfig({ announcement })} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs">
            Update
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  // Persistence: Muat user dari localStorage saat startup
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("quest8_user");
    return saved ? JSON.parse(saved) : null;
  });

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

  // Sync user state ke localStorage
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

  const loadData = useCallback(async () => {
    try {
      const [users, quests, progress, config] = await Promise.all([dbService.getUsers(), dbService.getQuests(), dbService.getProgress(), dbService.getConfig()]);

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
      console.error("Load failed:", e);
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
    if (found) setUser(found);
    else showAlert("Username/Password salah!");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password || !loginForm.name) return showAlert("Harap isi semua bidang!");
    const newUser: User = { id: `u_${Date.now()}`, username: loginForm.username, password: loginForm.password, name: loginForm.name, role: UserRole.STUDENT, xp: 0, streak: 0, unlockedChapters: ["bab1"] };
    try {
      await dbService.saveUser(newUser);
      setDbUsers((p) => [...p, newUser]);
      setUser(newUser);
      showAlert("Berhasil!");
    } catch (e) {
      showAlert("Gagal pendaftaran.");
    }
  };

  const onQuizFinish = async (score: number) => {
    if (!user || !activeQuest) return;
    if (score >= activeQuest.passingScore) {
      const already = dbProgress.some((p) => p.userId === user.id && p.levelId === activeQuest.id);
      if (!already) {
        await dbService.saveProgress({ userId: user.id, levelId: activeQuest.id, score, completedAt: new Date().toISOString() });
        const updated = { ...user, xp: user.xp + activeQuest.rewardPoints };
        await dbService.saveUser(updated);
        setUser(updated);
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
              <input
                type="text"
                placeholder="Nama Lengkap"
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none"
                value={loginForm.name}
                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
              />
            )}
            <input
              type="text"
              placeholder="Username"
              className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
              {isRegistering ? "Create Account" : "Enter the Realm"}
            </button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] font-black uppercase text-slate-500">
              {isRegistering ? "Sudah punya akun? Masuk" : "Daftar Siswa Baru"}
            </button>
          </form>
          {alert && <div className="bg-rose-950/50 border border-rose-900/50 p-4 rounded-2xl text-rose-400 font-bold text-center">{alert}</div>}
        </div>
      </div>
    );

  return (
    <Layout user={user} onLogout={() => setUser(null)} onViewChange={setView} activeView={view}>
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
        />
      )}
      {view === "quest-detail" && activeQuest && (
        <div className="max-w-4xl mx-auto py-12 px-6">
          {!isQuizMode ? (
            <div className="space-y-12 animate-in fade-in duration-700">
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
            <div className="max-w-2xl mx-auto">
              <QuizEngine questions={activeQuest.questions} passingScore={activeQuest.passingScore} onFinish={onQuizFinish} />
            </div>
          )}
        </div>
      )}
      <AISensei topic={activeQuest?.topic || "General English"} isOpen={isAiChatOpen} setIsOpen={setIsAiChatOpen} />
      {alert && view !== "login" && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl">{alert}</div>}
    </Layout>
  );
};

export default App;
