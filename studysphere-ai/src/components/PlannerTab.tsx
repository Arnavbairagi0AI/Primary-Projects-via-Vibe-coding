import React, { useState, useEffect } from 'react';
import { ExamMilestone } from '../types';

export const PlannerTab: React.FC = () => {
  const [milestones] = useState<ExamMilestone[]>([
    {
      id: 'm1',
      subject: 'Physics',
      title: 'Quantum Mechanics Final Exam',
      date: 'Aug 10, 2026',
      timeRemaining: '8 Days left',
      progress: 75,
      color: '#3525cd'
    },
    {
      id: 'm2',
      subject: 'Mathematics',
      title: 'Multivariable Calculus Midterm',
      date: 'Aug 14, 2026',
      timeRemaining: '12 Days left',
      progress: 50,
      color: '#712ae2'
    },
    {
      id: 'm3',
      subject: 'Biology',
      title: 'Molecular Biology & Genetics Quiz',
      date: 'Aug 18, 2026',
      timeRemaining: '16 Days left',
      progress: 30,
      color: '#a63274'
    }
  ]);

  // Pomodoro Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pt-20 pb-28 px-4 md:px-12 max-w-[1280px] mx-auto animate-fadeIn">
      {/* Title */}
      <div className="mb-6 mt-2">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0b1c30]">
          Exam Planner & Focus Sessions
        </h2>
        <p className="text-sm md:text-base text-[#464555]">
          AI-calculated study schedules and deep work focus sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Pomodoro Focus Timer Card */}
        <div className="md:col-span-5 m3-card p-6 flex flex-col justify-between bg-gradient-to-br from-[#3525cd] to-[#712ae2] text-white relative overflow-hidden">
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              DEEP WORK TIMER
            </span>
            <span className="material-symbols-outlined text-2xl text-amber-300">
              timer
            </span>
          </div>

          <div className="my-8 text-center z-10">
            <div className="text-6xl font-black tracking-tight font-mono mb-2">
              {formatTimer(timerSeconds)}
            </div>
            <p className="text-sm font-medium text-white/80">
              {isTimerRunning ? 'Session in progress... Stay focused!' : 'Ready for a 25-min study sprint?'}
            </p>
          </div>

          <div className="flex gap-3 z-10">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex-1 py-3 rounded-full bg-white text-[#3525cd] font-bold text-sm shadow-md hover:bg-white/90 active:scale-95 transition-all"
            >
              {isTimerRunning ? 'Pause Session' : 'Start Focus Sprint'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(25 * 60);
              }}
              className="px-4 py-3 rounded-full bg-white/20 text-white font-semibold text-sm hover:bg-white/30 transition-all"
              title="Reset Timer"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
          </div>
        </div>

        {/* Milestone Cards */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-[#464555] uppercase tracking-wider">
            Upcoming Exam Milestones
          </h3>

          {milestones.map(m => (
            <div
              key={m.id}
              className="m3-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#3525cd]/40 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: m.color }}
                  ></span>
                  <span className="text-xs font-bold uppercase text-[#464555]">
                    {m.subject}
                  </span>
                  <span className="text-xs font-semibold text-[#3525cd] bg-[#4f46e5]/10 px-2.5 py-0.5 rounded-full">
                    {m.timeRemaining}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#0b1c30]">{m.title}</h4>
                <p className="text-xs text-[#464555] mt-0.5">Target Date: {m.date}</p>
              </div>

              <div className="w-full sm:w-32 flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-[#3525cd]">{m.progress}% Prepared</span>
                <div className="w-full h-2 bg-[#d3e4fe] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.progress}%`, backgroundColor: m.color }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
