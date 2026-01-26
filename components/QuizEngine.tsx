
import React, { useState } from 'react';
import { Trophy, X, ArrowRight, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Question } from '../types';

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
    const newAns = [...answers, val];
    setAnswers(newAns);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const correctCount = answers.filter((ans, i) => ans === questions[i].correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const isPassed = score >= passingScore;

    return (
      <div className="text-center py-12 px-6 space-y-8 animate-in zoom-in-95 duration-500">
        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-3 transform transition-transform hover:rotate-0 ${isPassed ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-900/20' : 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-900/20'}`}>
          {isPassed ? <Trophy size={64} /> : <X size={64}/>}
        </div>
        
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">
            {isPassed ? "Quest Conquered!" : "Try Again, Hero"}
          </h3>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
            {isPassed ? "You've mastered these skills." : "Practice makes perfect."}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-sm mx-auto shadow-inner">
          <div className="text-6xl font-black text-white mb-2 tracking-tighter">{score}%</div>
          <div className="flex justify-center gap-4">
             <div className="text-[10px] font-black text-slate-400 uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">Correct: {correctCount}</div>
             <div className="text-[10px] font-black text-slate-400 uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">Total: {questions.length}</div>
          </div>
        </div>

        <button 
          onClick={() => onFinish(score)} 
          className={`w-full max-w-xs py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isPassed ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}
        >
          {isPassed ? "Claim Rewards" : "Return & Study"}
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  const current = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Header Progress */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950 px-3 py-1 rounded-full border border-indigo-900/50">
              Quest Challenge
            </span>
            <h4 className="text-2xl font-black text-white mt-2 uppercase tracking-tight">Question {step + 1}</h4>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{step + 1} of {questions.length}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
           <div 
             className="h-full bg-indigo-600 transition-all duration-700 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
             style={{ width: `${progress}%` }} 
           />
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-sm">
        <h4 className="text-xl font-extrabold text-white leading-tight mb-8">
          {current.q}
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {current.type === 'mcq' ? (
            current.a?.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(i)} 
                className="group relative p-6 bg-slate-950 border-2 border-slate-800 rounded-2xl text-left font-bold text-slate-300 hover:border-indigo-600 hover:bg-indigo-900/20 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-xs uppercase font-black group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
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
                className="group p-10 bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] font-black uppercase text-emerald-500 hover:border-emerald-600 hover:bg-emerald-950 active:scale-95 shadow-sm flex flex-col items-center gap-3 transition-all"
              >
                <CheckCircle2 size={32} />
                <span>True</span>
              </button>
              <button 
                onClick={() => handleAnswer(false)} 
                className="group p-10 bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] font-black uppercase text-rose-500 hover:border-rose-600 hover:bg-rose-950 active:scale-95 shadow-sm flex flex-col items-center gap-3 transition-all"
              >
                <X size={32} />
                <span>False</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-600">
        <Clock size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Think carefully, adventurer</span>
      </div>
    </div>
  );
};

export default QuizEngine;