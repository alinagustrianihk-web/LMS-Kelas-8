import React, { useState } from "react";
import { Trophy, X, ArrowRight, CheckCircle2, Clock, RotateCcw, Award, Star, ThumbsUp, Frown } from "lucide-react";
import { Question } from "../types";

interface QuizEngineProps {
  questions: Question[];
  passingScore: number;
  onFinish: (score: number) => void;
}

const QuizEngine: React.FC<QuizEngineProps> = ({ questions, passingScore, onFinish }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (val: any) => {
    const updatedAnswers = [...answers, val];
    setAnswers(updatedAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const correctCount = answers.filter((ans, i) => {
      // Kembali ke Strict Comparison (===)
      return ans === questions[i].correct;
    }).length;

    const score = Math.round((correctCount / questions.length) * 100);
    const isPassed = score >= passingScore;

    const getFeedbackMessage = () => {
      if (score === 100) return { title: "Perfect Victory!", sub: "Kamu luar biasa! Pengetahuanmu sempurna.", icon: <Award className="w-16 h-16" />, color: "from-amber-400 to-orange-600" };
      if (isPassed) return { title: "Quest Conquered!", sub: "Kerja bagus! Kamu berhasil melewati tantangan ini.", icon: <Trophy className="w-16 h-16" />, color: "from-emerald-400 to-emerald-700" };
      return { title: "Defeat is Learning", sub: "Jangan menyerah. AI Sensei siap membantumu belajar lebih giat.", icon: <Frown className="w-16 h-16" />, color: "from-rose-500 to-rose-800" };
    };

    const feedback = getFeedbackMessage();

    return (
      <div className="py-8 px-4 space-y-12 animate-in zoom-in-95 duration-500 pb-20">
        <div className="text-center space-y-6">
          <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl rotate-3 transform transition-transform hover:rotate-0 bg-gradient-to-br ${feedback.color} text-white`}>{feedback.icon}</div>

          <div>
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-2 text-white italic">{feedback.title}</h3>
            <p className="text-slate-400 font-bold text-sm tracking-wide">{feedback.sub}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-10 max-w-sm mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Star size={80} className="text-white fill-white" />
            </div>
            <div className="relative z-10">
              <div className="text-7xl font-black text-white mb-2 tracking-tighter italic">{score}%</div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-6">Final Score</p>
              <div className="flex justify-center gap-3">
                <div className="flex-1 text-[10px] font-black text-slate-300 uppercase bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">Correct: {correctCount}</div>
                <div className="flex-1 text-[10px] font-black text-slate-300 uppercase bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">Total: {questions.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] flex-grow bg-slate-800" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 whitespace-nowrap">Battle Log Review</h4>
            <div className="h-[2px] flex-grow bg-slate-800" />
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct;
              return (
                <div key={i} className={`p-6 rounded-[2rem] border-2 transition-all ${isCorrect ? "bg-emerald-950/10 border-emerald-500/20" : "bg-rose-950/10 border-rose-500/20"}`}>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>{i + 1}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pertanyaan</span>
                    </div>
                    {isCorrect ? (
                      <div className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Correct
                      </div>
                    ) : (
                      <div className="text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                        <X size={14} /> Incorrect
                      </div>
                    )}
                  </div>
                  <p className="text-slate-100 font-bold text-sm mb-6 leading-relaxed">{q.q}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-2xl border ${isCorrect ? "bg-emerald-950/30 border-emerald-500/20" : "bg-rose-950/30 border-rose-500/20"}`}>
                      <p className="text-[8px] font-black uppercase text-slate-500 mb-2">Jawaban Kamu</p>
                      <p className={`text-xs font-black ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>{q.type === "mcq" ? q.a?.[Number(answers[i])] || answers[i] : answers[i] ? "True" : "False"}</p>
                    </div>
                    {!isCorrect && (
                      <div className="p-4 rounded-2xl border bg-emerald-950/20 border-emerald-500/20">
                        <p className="text-[8px] font-black uppercase text-emerald-500/50 mb-2">Jawaban Benar</p>
                        <p className="text-xs font-black text-emerald-400">{q.type === "mcq" ? q.a?.[Number(q.correct)] : q.correct ? "True" : "False"}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-6 pb-20">
          {!isPassed && (
            <button
              onClick={() => {
                setStep(0);
                setAnswers([]);
                setFinished(false);
              }}
              className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest border border-slate-800 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
            >
              <RotateCcw size={18} /> Coba Lagi
            </button>
          )}
          <button
            onClick={() => onFinish(score)}
            className={`flex-1 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isPassed ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/40" : "bg-slate-800 text-slate-100 hover:bg-slate-700"}`}
          >
            {isPassed ? "Ambil Reward" : "Kembali Belajar"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950 px-3 py-1 rounded-full border border-indigo-900/50">Quest Challenge</span>
            <h4 className="text-2xl font-black text-white mt-2 uppercase tracking-tight italic">Question {step + 1}</h4>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {step + 1} of {questions.length}
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={`bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-sm relative overflow-hidden group transition-all`}>
        <div className="relative z-10">
          <h4 className="text-xl font-extrabold text-white leading-tight mb-10">{current.q}</h4>
          <div className="grid grid-cols-1 gap-4">
            {current.type === "mcq" ? (
              current.a?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="group relative p-6 bg-slate-950 border-2 border-slate-800 rounded-3xl text-left font-bold text-slate-300 hover:border-indigo-600 hover:bg-indigo-900/20 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-xs uppercase font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-base">{opt}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={() => handleAnswer(true)}
                  className="group p-10 bg-slate-950 border-2 border-slate-800 rounded-[3rem] font-black uppercase text-emerald-500 hover:border-emerald-600 hover:bg-emerald-950 active:scale-95 shadow-sm flex flex-col items-center gap-3 transition-all"
                >
                  <CheckCircle2 size={32} />
                  <span>True</span>
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  className="group p-10 bg-slate-950 border-2 border-slate-800 rounded-[3rem] font-black uppercase text-rose-500 hover:border-rose-600 hover:bg-rose-950 active:scale-95 shadow-sm flex flex-col items-center gap-3 transition-all"
                >
                  <X size={32} />
                  <span>False</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-600">
        <Clock size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest italic">Take your time, Sensei is watching...</span>
      </div>
    </div>
  );
};

export default QuizEngine;
