import React from "react";
import { LogOut, Bell, User as UserIcon, Menu, X, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { User, UserRole } from "../types";

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
  activeView: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, onViewChange, children, activeView, isMuted, onToggleMute }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div onClick={() => onViewChange("dashboard")} className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform shadow-lg shadow-indigo-900/20">Q</div>
              <span className="font-black text-xl uppercase tracking-tighter text-white">
                Quest8 <span className="text-indigo-500">LMS</span>
              </span>
            </div>

            {/* Desktop Nav */}
            {user && (
              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={onToggleMute}
                  className={`p-2.5 rounded-xl border transition-all ${isMuted ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-indigo-950/50 text-indigo-400 border-indigo-900/30"}`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <div className="flex items-center gap-3 bg-indigo-950 px-4 py-2 rounded-2xl border border-indigo-900/30">
                  <div className={`w-2.5 h-2.5 rounded-full ${user.role === UserRole.ADMIN ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" : user.role === UserRole.TEACHER ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-400">{user.role}</span>
                </div>

                <div className="flex items-center gap-4">
                  <button className="p-2.5 text-slate-500 hover:text-indigo-500 transition-colors">
                    <Bell size={20} />
                  </button>
                  <div className="h-8 w-[1px] bg-slate-800" />
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-black text-white">{user.name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.xp} XP</p>
                    </div>
                    <button onClick={onLogout} className="p-2.5 bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl border border-slate-800 transition-all">
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center gap-2">
              {user && (
                <button onClick={onToggleMute} className={`p-2 rounded-lg border transition-all ${isMuted ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-indigo-950/50 text-indigo-400 border-indigo-900/30"}`}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-6 space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center text-slate-600 border border-slate-800">
                <UserIcon />
              </div>
              <div>
                <p className="font-bold text-white">{user.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onViewChange("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold ${activeView === "dashboard" ? "bg-indigo-900/30 text-indigo-400" : "text-slate-400"}`}
            >
              Dashboard
            </button>
            <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-950/30">
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Content Area */}
      <main>{children}</main>

      {/* Footer / Mobile Sticky */}
      {user && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="flex flex-col gap-2">
            <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-800 p-4 rounded-3xl shadow-2xl flex items-center gap-4 transition-all hover:scale-105">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950 flex items-center justify-center text-emerald-500 border border-emerald-900/30">
                <ShieldCheck size={24} />
              </div>
              <div className="pr-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</p>
                <p className="text-sm font-black text-white">Protected Account</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
