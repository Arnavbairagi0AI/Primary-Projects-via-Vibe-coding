/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Exam, StudyTask } from '../types';

interface ExamPlannerViewProps {
  userProfile: UserProfile;
  exams: Exam[];
  onAddExam: (exam: Exam) => void;
  onUpdateExam: (exam: Exam) => void;
}

export default function ExamPlannerView({
  userProfile,
  exams,
  onAddExam,
  onUpdateExam
}: ExamPlannerViewProps) {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // New Exam Form
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [studyHours, setStudyHours] = useState('2');
  const [topics, setTopics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate || !topics.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/generate-timetable', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userProfile.uid
        },
        body: JSON.stringify({
          examName,
          examDate,
          studyHours,
          topics
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate study timetable.');
      }

      const data = await response.json();

      const newExam: Exam = {
        id: 'exam_' + Date.now(),
        userId: userProfile.uid,
        name: examName,
        date: examDate,
        timetable: data.timetable || [],
        tasks: (data.tasks || []).map((t: any, i: number) => ({
          id: t.id || `task_${Date.now()}_${i}`,
          text: t.text,
          completed: false
        })),
        createdAt: new Date().toISOString()
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'exams', newExam.id), newExam);
      } catch (fErr) {
        console.warn("Firestore save skip:", fErr);
      }

      onAddExam(newExam);
      setSelectedExam(newExam);

      // Clear Form
      setExamName('');
      setExamDate('');
      setTopics('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with Gemini model.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!selectedExam) return;

    const updatedTasks = selectedExam.tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });

    const updatedExam = {
      ...selectedExam,
      tasks: updatedTasks
    };

    onUpdateExam(updatedExam);
    setSelectedExam(updatedExam);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'exams', selectedExam.id), updatedExam);
    } catch (err) {
      console.warn("Skipping firestore task update:", err);
    }
  };

  // Add a manual checklist study task
  const [newTaskText, setNewTaskText] = useState('');
  const handleAddManualTask = async () => {
    if (!selectedExam || !newTaskText.trim()) return;

    const newTask: StudyTask = {
      id: 'task_' + Date.now(),
      text: newTaskText.trim(),
      completed: false
    };

    const updatedExam = {
      ...selectedExam,
      tasks: [...selectedExam.tasks, newTask]
    };

    onUpdateExam(updatedExam);
    setSelectedExam(updatedExam);
    setNewTaskText('');

    // Save to Firestore
    try {
      await setDoc(doc(db, 'exams', selectedExam.id), updatedExam);
    } catch (err) {
      console.warn("Skipping firestore task write:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Planner form sidebar */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Planner Creator */}
        <div className="study-card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h3 className="text-md font-bold text-stone-800">Syllabus Planner</h3>
          </div>

          <form onSubmit={handleGeneratePlanner} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Exam / Contest Name</label>
              <input 
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. JEE Advanced, NEET"
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Exam Date</label>
              <input 
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Target Study Hours (Daily)</label>
              <select 
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                className="w-full bg-[#F5F5F0] border border-black/5 rounded-xl px-2.5 py-2.5 text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="4">4 Hours</option>
                <option value="6">6 Hours+</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Topics to Cover</label>
              <textarea 
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                rows={4}
                required
                placeholder="List key subjects or book chapters to partition into your daily planner..."
                className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all resize-none"
              />
            </div>

            {error && <p className="text-[10px] text-red-500 font-bold">⚠️ {error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] hover:bg-[#494933] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {loading ? 'Synthesizing Plan...' : 'Generate AI Study Plan'}
            </button>
          </form>
        </div>

        {/* Existing plans list */}
        <div className="study-card p-6 bg-white">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black mb-4">Schedules Portfolio</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {exams.length > 0 ? exams.map(e => (
              <div
                key={e.id}
                onClick={() => setSelectedExam(e)}
                className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer border transition-all ${selectedExam?.id === e.id ? 'bg-[#5A5A40]/10 text-brand-sage border-[#5A5A40]/20' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}
              >
                <span className="truncate">📅 {e.name}</span>
                <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
              </div>
            )) : (
              <p className="text-[11px] text-stone-400 font-medium text-center py-4">No exams scheduled yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Main planner dockets display */}
      <div className="lg:col-span-2 space-y-6">
        
        {selectedExam ? (
          <div className="study-card p-8 bg-white space-y-6">
            
            {/* Header and Countdown clock */}
            <div className="flex justify-between items-start border-b border-stone-100 pb-5">
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 bg-brand-sage/10 text-brand-sage rounded-full text-[10px] font-black uppercase tracking-wider">
                  AI Study Schedule
                </span>
                <h2 className="text-2xl font-serif italic text-stone-800 font-bold">{selectedExam.name}</h2>
                <p className="text-xs text-stone-400">Exam Date: {new Date(selectedExam.date).toLocaleDateString()}</p>
              </div>

              {/* Countdown clock */}
              <div className="bg-[#2C2C2B] text-white rounded-2xl p-3 text-center">
                <span className="text-xl font-bold font-mono">
                  {Math.ceil((new Date(selectedExam.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                </span>
                <p className="text-[8px] uppercase text-stone-400 tracking-widest font-black mt-0.5">Days Left</p>
              </div>
            </div>

            {/* AI timetable schedule representation */}
            {selectedExam.timetable && selectedExam.timetable.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Weekly Target Allocation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedExam.timetable.map((t, idx) => (
                    <div key={idx} className="p-4 bg-[#FDFBF7] rounded-2xl border border-stone-100">
                      <strong className="text-brand-sage font-bold text-xs uppercase tracking-wider block mb-1.5">{t.day}</strong>
                      <ul className="space-y-1 text-xs text-stone-600 font-medium">
                        {t.topics.map((topic, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-[#D4A373]">✦</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Checklist tasks */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-black text-stone-400">Daily Study Tasks</h4>
              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 space-y-4">
                
                {/* Add Custom Task */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a revision task or milestone (e.g. Solve 10 mock chemistry papers)..."
                    className="bg-white border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2 text-xs flex-1 outline-none"
                  />
                  <button 
                    onClick={handleAddManualTask}
                    className="bg-[#5A5A40] hover:bg-[#494933] text-white text-xs px-4 rounded-xl font-bold uppercase tracking-wider"
                  >
                    Add
                  </button>
                </div>

                {/* List Tasks */}
                <div className="space-y-2 divide-y divide-stone-200">
                  {selectedExam.tasks && selectedExam.tasks.length > 0 ? selectedExam.tasks.map((task) => (
                    <div key={task.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <input 
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="w-4 h-4 accent-[#5A5A40] cursor-pointer"
                        />
                        <span className={`font-semibold text-stone-700 ${task.completed ? 'line-through text-stone-400' : ''}`}>
                          {task.text}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${task.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                        {task.completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  )) : (
                    <p className="text-[11px] text-stone-400 text-center py-2">No active study tasks. Add some milestones!</p>
                  )}
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="study-card p-12 bg-white flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
            <span className="text-4xl">📅</span>
            <h3 className="text-lg font-serif italic text-stone-700">No active Study Plan selected</h3>
            <p className="text-stone-400 text-xs max-w-sm">Use the form on the left to add your exam targets. Our AI engine will divide your syllabus topics into an optimized, highly actionable weekly study timetable instantly!</p>
          </div>
        )}

      </div>

    </div>
  );
}
