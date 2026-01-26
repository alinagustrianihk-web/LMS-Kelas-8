import React, { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  CheckCircle2,
  Users,
  Play,
  Eye,
  Settings,
  BarChart3,
  UserPlus,
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  ShieldAlert,
  Info,
  Trash2,
  Loader2,
  UserCircle2,
  Mail,
  Lock,
  ShieldCheck,
  Key,
  BookOpen,
  LayoutDashboard,
  Zap,
  Award,
  Bot,
  Flame,
} from "lucide-react";
import { INITIAL_CURRICULUM, DEFAULT_USERS } from "./constants.tsx";
import { User, UserRole, Quest, Progress, SystemConfig } from "./types.ts";
import Layout from "./components/Layout.tsx";
import QuizEngine from "./components/QuizEngine.tsx";
import AISensei from "./components/AISensei.tsx";
import { dbService } from "./services/dbService.ts";

const ContentRenderer: React.FC<{ content: Quest["content"] }> = ({ content }) => (
  <div className="space-y-8">
    {content.map((item, idx) => {
      if (item.type === "h1")
        return (
          <h1 key={idx} className="text-4xl font-black text-white border-l-8 border-indigo-600 pl-6 uppercase tracking-tight">
            {item.text}
          </h1>
        );
      if (item.type === "h2")
        return (
          <h2 key={idx} className="text-xl font-bold text-indigo-400 uppercase mt-8 tracking-widest flex items-center gap-3">
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
                <div className="w-6 h-6 flex-shrink-0 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 text-xs border border-indigo-900/50">{i + 1}</div>
                <span>{li}</span>
              </li>
            ))}
          </ul>
        );
      return null;
    })}
  </div>
);

export default function App() {
  // Firebase Data States
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbLevels, setDbLevels] = useState<Quest[]>([]);
  const [dbProgress, setDbProgress] = useState<Progress[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ semester: "2", year: "2025/2026", maintenance: false });

  // UI States
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState("dashboard");
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const initApp = async () => {
    try {
      setLoading(true);
      setPermissionError(false);

      let fetchedUsers = await dbService.getUsers();
      let fetchedQuests = await dbService.getQuests();
      let fetchedProgress = await dbService.getProgress();
      let fetchedConfig = await dbService.getConfig();

      // Seed default data if collections are empty
      if (fetchedUsers.length === 0) {
        for (const u of DEFAULT_USERS) await dbService.saveUser(u);
        fetchedUsers = DEFAULT_USERS;
      }
      if (fetchedQuests.length === 0) {
        for (const q of INITIAL_CURRICULUM) await dbService.saveQuest(q);
        fetchedQuests = INITIAL_CURRICULUM;
      }
      if (!fetchedConfig) {
        const defaultConfig = { semester: "2", year: "2025/2026", maintenance: false };
        await dbService.saveConfig(defaultConfig);
        fetchedConfig = defaultConfig;
      }

      setDbUsers(fetchedUsers);
      setDbLevels(fetchedQuests);
      setDbProgress(fetchedProgress);
      setSystemConfig(fetchedConfig);
    } catch (err: any) {
      console.error("Firebase Init Error:", err);
      if (err.code === "permission-denied" || err.message?.includes("permissions")) {
        setPermissionError(true);
      } else {
        showAlert("Koneksi Cloud bermasalah!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const showAlert = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 4000);
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).toLowerCase().trim();
    const password = formData.get("password") as string;

    const found = dbUsers.find((u) => u.email.toLowerCase() === email && u.password === password);

    if (found) {
      if (systemConfig.maintenance && found.role !== UserRole.ADMIN) {
        return showAlert("Sistem sedang Maintenance!");
      }
      setUser(found);
      setView("dashboard");
      showAlert(`Halo, ${found.name}!`);
    } else {
      showAlert("Login Gagal! Email/Password salah.");
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).toLowerCase().trim();
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (dbUsers.some((u) => u.email === email)) {
      return showAlert("Email sudah terdaftar!");
    }

    const newUser: User = {
      id: "u" + Date.now(),
      name,
      email,
      password,
      role: UserRole.STUDENT,
      xp: 0,
      streak: 0,
    };

    try {
      setLoading(true);
      await dbService.saveUser(newUser);
      // Sync local state
      setDbUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      setView("dashboard");
      showAlert("Pendaftaran Berhasil! Selamat berjuang.");
    } catch (err) {
      showAlert("Gagal mendaftar ke Cloud. Cek izin database.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestComplete = async (questId: string, score: number, points: number) => {
    if (!user) return;

    // Check if user already finished this quest
    const existingProgress = dbProgress.find((p) => p.userId === user.id && p.levelId === questId);

    const newProgress: Progress = {
      userId: user.id,
      levelId: questId,
      score,
      completedAt: new Date().toISOString(),
    };

    try {
      await dbService.saveProgress(newProgress);
      // Update local progress state
      setDbProgress((prev) => {
        const filtered = prev.filter((p) => !(p.userId === user.id && p.levelId === questId));
        return [...filtered, newProgress];
      });

      // Calculate Streak
      const today = new Date().toISOString().split("T")[0];
      let newStreak = user.streak || 0;
      let lastDate = user.lastCompletionDate;

      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      // Update User XP and Streak in Cloud and state if it's their first time finishing this quest
      if (!existingProgress) {
        const updatedUser = {
          ...user,
          xp: user.xp + points,
          streak: newStreak,
          lastCompletionDate: today,
        };
        await dbService.saveUser(updatedUser);
        setDbUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
        setUser(updatedUser);
        showAlert(`Quest Selesai! +${points} XP Berhasil diklaim. Streak: ${newStreak} Hari!`);
      } else {
        // If they already finished, we still update the streak if they haven't today
        const updatedUser = {
          ...user,
          streak: newStreak,
          lastCompletionDate: today,
        };
        await dbService.saveUser(updatedUser);
        setDbUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
        setUser(updatedUser);
        showAlert("Skor diperbarui! Streak kamu tetap aktif.");
      }
    } catch (err) {
      console.error("Progress save error:", err);
      showAlert("Gagal menyimpan progress ke Cloud.");
    }
  };

  const handleCreateUserByAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).toLowerCase().trim();

    if (dbUsers.some((u) => u.email === email)) {
      return showAlert("Email sudah digunakan!");
    }

    const newUser: User = {
      id: "u" + Date.now(),
      name: formData.get("name") as string,
      email: email,
      password: formData.get("password") as string,
      role: formData.get("role") as UserRole,
      xp: 0,
      streak: 0,
    };

    try {
      await dbService.saveUser(newUser);
      setDbUsers((prev) => [...prev, newUser]);
      (e.target as HTMLFormElement).reset();
      showAlert("Akun baru berhasil didaftarkan oleh Admin.");
    } catch (err) {
      showAlert("Gagal menyimpan akun.");
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === user?.id) {
      return showAlert("Kamu tidak bisa menghapus akun kamu sendiri!");
    }

    if (!confirm(`Hapus akun ${targetUser.name} secara permanen dari Cloud?`)) {
      return;
    }

    try {
      await dbService.deleteUser(targetUser.id);
      setDbUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showAlert(`Akun ${targetUser.name} berhasil dihapus.`);
    } catch (err) {
      console.error("Delete user error:", err);
      showAlert("Gagal menghapus akun. Cek koneksi atau izin.");
    }
  };

  if (permissionError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-10 text-center">
        <ShieldAlert className="text-rose-500 mb-6 animate-bounce" size={80} />
        <h2 className="text-4xl font-black uppercase tracking-tight mb-4 italic">Cloud Connection Error</h2>
        <div className="bg-slate-900 p-10 rounded-[3rem] max-w-xl border-2 border-slate-800 shadow-2xl space-y-6">
          <p className="text-slate-300 font-medium">
            Izin Database ditolak. Pastikan Firebase Rules di Console sudah diatur ke <b>Mode Test</b> agar siswa bisa mendaftar.
          </p>
          <div className="bg-slate-950 p-6 rounded-2xl font-mono text-left text-indigo-400 text-xs border border-indigo-900/50">allow read, write: if true;</div>
          <button onClick={initApp} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg">
            Refresh & Hubungkan
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="relative mb-12">
          <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] animate-pulse-slow">
            <span className="text-6xl font-black italic">Q</span>
          </div>
          <Loader2 className="absolute -bottom-4 -right-4 text-indigo-400 animate-spin" size={48} />
        </div>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest animate-pulse tracking-[0.5em]">Synchronizing Cloud...</p>
      </div>
    );
  }

  const StudentDashboard = () => {
    if (!user) return null;
    const completedQuests = dbProgress.filter((p) => p.userId === user.id);
    const completedCount = completedQuests.length;
    const progressPercent = dbLevels.length > 0 ? (completedCount / dbLevels.length) * 100 : 0;

    return (
      <div className="max-w-7xl mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
        {/* Left Column: Progress & Quests */}
        <div className="lg:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-900/10 rounded-bl-full -mr-24 -mt-24 opacity-50 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-white italic">XP</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pencapaian Belajar</p>
                  </div>
                  <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black italic text-lg shadow-xl shadow-indigo-900/20">{user.xp} XP</div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex-grow h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-3xl font-black text-white">{Math.round(progressPercent)}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] border border-orange-500/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-bl-full -mr-24 -mt-24 opacity-50 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-white italic">Streak</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hari Berturut-turut</p>
                  </div>
                  <div className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black italic text-lg shadow-xl shadow-orange-900/20 flex items-center gap-2">
                    <Flame size={20} className="fill-current" />
                    {user.streak || 0}
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  {user.streak && user.streak > 0 ? `Luar biasa! Kamu sudah belajar selama ${user.streak} hari berturut-turut.` : "Selesaikan 1 quest hari ini untuk memulai streak!"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {dbLevels.map((lvl, idx) => {
              const userProgress = dbProgress.find((p) => p.userId === user.id && p.levelId === lvl.id);
              const isDone = !!userProgress;
              const isLocked = idx > 0 && !dbProgress.some((p) => p.userId === user.id && p.levelId === dbLevels[idx - 1].id) && !isDone;

              return (
                <div
                  key={lvl.id}
                  onClick={() => !isLocked && (setActiveQuest(lvl), setView("quest-detail"), setIsQuizMode(false))}
                  className={`relative h-72 rounded-[3rem] overflow-hidden cursor-pointer group border-4 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-2 ${isDone ? "border-emerald-500/50" : "border-slate-900 hover:border-indigo-600/50"} ${isLocked ? "opacity-40 pointer-events-none grayscale" : ""}`}
                >
                  <img src={lvl.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={lvl.topic} />
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/30 to-transparent ${isDone ? "from-emerald-950/90" : "from-slate-950/90"}`} />
                  <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <span className="bg-slate-900/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">{lvl.title}</span>
                      {isDone && (
                        <div className="bg-emerald-500 p-2 rounded-xl shadow-lg animate-bounce shadow-emerald-900/20">
                          <CheckCircle2 size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">{lvl.topic}</p>
                      <h3 className="text-2xl font-black uppercase leading-tight italic">{lvl.title.includes("Quest") ? lvl.topic : lvl.title}</h3>
                      {isDone && <p className="text-[10px] font-black uppercase text-emerald-400 mt-2">Score: {userProgress.score}%</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-xl">
            <h3 className="font-black uppercase text-sm tracking-widest mb-8 flex items-center gap-3 text-slate-100">
              <Trophy size={20} className="text-amber-500" /> Hall of Fame
            </h3>
            <div className="space-y-3">
              {dbUsers
                .filter((u) => u.role === UserRole.STUDENT)
                .sort((a, b) => b.xp - a.xp)
                .slice(0, 10)
                .map((u, i) => (
                  <div
                    key={u.id}
                    className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${u.id === user.id ? "bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105" : "bg-slate-950 border-slate-800"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? "bg-amber-400 text-amber-900" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-700 text-amber-50" : "bg-slate-800 text-slate-400"}`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <span className={`text-xs font-black uppercase block ${u.id === user.id ? "text-white" : "text-slate-200"}`}>{u.name}</span>
                        {u.id === user.id && <span className="text-[8px] uppercase font-black opacity-60 text-white">Peringkat Kamu</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${u.id === user.id ? "text-white" : "text-indigo-400"}`}>{u.xp}</span>
                      <span className="text-[8px] font-black uppercase opacity-50 block text-slate-500">XP</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-700 to-violet-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <Bot className="absolute -bottom-4 -right-4 opacity-20" size={120} />
            <h3 className="text-xl font-black italic uppercase mb-4">Butuh Bantuan?</h3>
            <p className="text-xs font-medium text-indigo-100 mb-6 leading-relaxed">AI Sensei siap membantumu memahami Recount Text kapan saja.</p>
            <button onClick={() => setIsAiChatOpen(true)} className="bg-white text-indigo-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
              Mulai Chat
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TeacherDashboard = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter italic text-white">Academic Hub</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Classroom Analytics & Control</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-xl p-10">
          <h3 className="font-black uppercase text-sm tracking-widest mb-8 flex items-center gap-3 text-slate-100">
            <Users size={20} className="text-indigo-500" /> Daftar Siswa
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm font-bold">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-6">Siswa</th>
                  <th className="pb-6 text-center">XP</th>
                  <th className="pb-6 text-center">Streak</th>
                  <th className="pb-6 text-center">Progress</th>
                  <th className="pb-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbUsers
                  .filter((u) => u.role === UserRole.STUDENT)
                  .sort((a, b) => b.xp - a.xp)
                  .map((s) => {
                    const p = Math.round((dbProgress.filter((pr) => pr.userId === s.id).length / dbLevels.length) * 100);
                    return (
                      <tr key={s.id} className="group hover:bg-slate-950 transition-colors">
                        <td className="py-6 flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-950 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-900/50 font-black uppercase">{s.name.charAt(0)}</div>
                          <div>
                            <p className="text-slate-100">{s.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">{s.email}</p>
                          </div>
                        </td>
                        <td className="py-6 text-center text-indigo-400 font-black">{s.xp}</td>
                        <td className="py-6 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-orange-500 font-black">
                            <Flame size={14} className="fill-current" />
                            {s.streak || 0}
                          </div>
                        </td>
                        <td className="py-6 text-center">
                          <div className="w-24 h-2 bg-slate-950 rounded-full mx-auto overflow-hidden border border-slate-800">
                            <div className="h-full bg-emerald-600" style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-500">{p}%</span>
                        </td>
                        <td className="py-6 text-right">
                          <button className="p-2.5 text-slate-600 hover:text-indigo-500 transition-colors">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Statistik Kelas</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Siswa</p>
                <p className="text-4xl font-black">{dbUsers.filter((u) => u.role === UserRole.STUDENT).length}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Quest Aktif</p>
                <p className="text-4xl font-black">{dbLevels.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminPanel = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-6xl font-black uppercase tracking-tighter italic text-white">
            Admin <span className="text-indigo-600">Core</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Cloud System Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <form onSubmit={handleCreateUserByAdmin} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-xl space-y-6">
            <h3 className="font-black uppercase text-sm flex items-center gap-3 text-slate-100">
              <UserPlus className="text-indigo-500" /> Daftarkan User
            </h3>
            <div className="space-y-4">
              <input name="name" placeholder="Nama Lengkap" required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-sm text-white focus:border-indigo-600 outline-none" />
              <input name="email" type="email" placeholder="Email" required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-sm text-white focus:border-indigo-600 outline-none" />
              <input name="password" type="text" placeholder="Password Awal" required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-sm text-white focus:border-indigo-600 outline-none" />
              <select name="role" className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-white outline-none focus:border-indigo-600">
                <option value={UserRole.STUDENT}>STUDENT</option>
                <option value={UserRole.TEACHER}>TEACHER</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
              </select>
            </div>
            <button className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20">Tambah ke Cloud</button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900 rounded-[3.5rem] border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Manajemen Database Akun</h3>
            <span className="bg-indigo-950 text-indigo-400 px-4 py-1 rounded-full text-[10px] font-black border border-indigo-900/50">{dbUsers.length} TOTAL USER</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs font-bold">
              <tbody className="divide-y divide-slate-800">
                {dbUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950 transition-colors">
                    <td className="p-6">
                      <p className="text-slate-100 font-black">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-orange-500 font-black">
                        <Flame size={14} className="fill-current" />
                        {u.streak || 0}
                      </div>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === UserRole.ADMIN ? "bg-rose-950 text-rose-400 border border-rose-900/50" : u.role === UserRole.TEACHER ? "bg-amber-950 text-amber-400 border border-amber-900/50" : "bg-indigo-950 text-indigo-400 border border-indigo-900/50"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={u.id === user?.id}
                        className={`p-3 transition-colors ${u.id === user?.id ? "text-slate-800 cursor-not-allowed" : "text-slate-600 hover:text-rose-500"}`}
                        title={u.id === user?.id ? "Akun sedang aktif" : "Hapus Akun"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700">
            <AlertCircle size={20} className="text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-widest">{msg}</span>
          </div>
        </div>
      )}

      {!user ? (
        <div className="min-h-[90vh] flex items-center justify-center px-6 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/5 rounded-full -mr-96 -mt-96 animate-pulse" />
          <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl p-12 rounded-[4rem] border border-slate-800 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl rotate-3 shadow-indigo-900/20">Q</div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">{authMode === "login" ? "Masuk Akademi" : "Daftar Siswa"}</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Quest8 LMS Gamified Platform</p>
            </div>

            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Sekolah"
                    required
                    className="w-full pl-14 pr-6 py-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none font-bold text-sm shadow-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="w-full pl-14 pr-6 py-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none font-bold text-sm shadow-sm"
                  />
                </div>
                <button className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-indigo-900/20">
                  Mulai Petualangan
                </button>
                <button type="button" onClick={() => setAuthMode("register")} className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                  Belum punya akun? <span className="text-indigo-500 underline">Daftar Siswa</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <UserCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    name="name"
                    type="text"
                    placeholder="Nama Lengkap"
                    required
                    className="w-full pl-14 pr-6 py-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none font-bold text-sm"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input name="email" type="email" placeholder="Email" required className="w-full pl-14 pr-6 py-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none font-bold text-sm" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    name="password"
                    type="password"
                    placeholder="Buat Password"
                    required
                    className="w-full pl-14 pr-6 py-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 focus:border-indigo-600 outline-none font-bold text-sm"
                  />
                </div>
                <button className="w-full py-6 bg-emerald-700 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-800 transition-all active:scale-95 shadow-emerald-900/20">
                  Buat Akun Siswa
                </button>
                <button type="button" onClick={() => setAuthMode("login")} className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                  Sudah punya akun? <span className="text-indigo-500 underline">Login</span>
                </button>
              </form>
            )}

            <div className="pt-6 border-t border-slate-800 flex flex-col items-center gap-2">
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <Key size={10} /> Admin Master: admin@smp.sch.id | admin
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {view === "quest-detail" && activeQuest ? (
            <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700 pb-32">
              <button onClick={() => setView("dashboard")} className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 mb-8 group">
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Peta
              </button>
              <div className="bg-slate-900 rounded-[4rem] border border-slate-800 shadow-2xl overflow-hidden">
                <div className="h-96 relative">
                  <img src={activeQuest.imageUrl} className="w-full h-full object-cover" alt={activeQuest.topic} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-12 left-12 text-white">
                    <span className="bg-indigo-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl mb-4 block w-fit">Modul {activeQuest.id.replace("q", "")}</span>
                    <h3 className="text-5xl font-black uppercase tracking-tighter mt-4 italic">{activeQuest.title.includes("Quest") ? activeQuest.topic : activeQuest.title}</h3>
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-widest">{activeQuest.rewardPoints} XP Reward</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-400" />
                        <span className="text-xs font-black uppercase tracking-widest">Passing Score: {activeQuest.passingScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-16">
                  {isQuizMode ? (
                    <QuizEngine
                      questions={activeQuest.questions}
                      passingScore={activeQuest.passingScore}
                      onFinish={(s) => {
                        if (s >= activeQuest.passingScore) handleQuestComplete(activeQuest.id, s, activeQuest.rewardPoints);
                        else handleQuestComplete(activeQuest.id, s, 0);
                        setView("dashboard");
                      }}
                    />
                  ) : (
                    <div className="space-y-12">
                      <ContentRenderer content={activeQuest.content} />
                      <div className="pt-8 border-t border-slate-800">
                        <button
                          onClick={() => setIsQuizMode(true)}
                          className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black uppercase text-lg tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 group shadow-indigo-900/20"
                        >
                          Mulai Ujian Quest <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                        <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6 italic">Selesaikan quest ini untuk mendapatkan {activeQuest.rewardPoints} XP!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : user.role === UserRole.ADMIN ? (
            <AdminPanel />
          ) : user.role === UserRole.TEACHER ? (
            <TeacherDashboard />
          ) : (
            <StudentDashboard />
          )}

          {/* AISensei sekarang di-render secara global untuk user yang login (Student) */}
          {user.role === UserRole.STUDENT && <AISensei topic={activeQuest?.topic || "General English Recount Text"} isOpen={isAiChatOpen} setIsOpen={setIsAiChatOpen} />}
        </>
      )}
    </Layout>
  );
}
