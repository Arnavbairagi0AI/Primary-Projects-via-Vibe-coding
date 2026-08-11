import React, { useState } from 'react';

interface QuickActionModalProps {
  actionType: string | null;
  onClose: () => void;
  onStartQuiz?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ actionType, onClose }) => {
  const [fileSelected, setFileSelected] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedSummary, setProcessedSummary] = useState<string | null>(null);

  if (!actionType) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileSelected(file.name);
      setIsProcessing(true);
      let p = 0;
      const timer = setInterval(() => {
        p += 20;
        setUploadProgress(p);
        if (p >= 100) {
          clearInterval(timer);
          setIsProcessing(false);
          setProcessedSummary(
            `Successfully processed "${file.name}"!\n• Key Concepts Extracted: 5\n• Active Recall Flashcards Generated: 8\n• AI Study Summary Ready!`
          );
        }
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {actionType === 'scan' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#eaddff] flex items-center justify-center text-[#25005a]">
                <span className="material-symbols-outlined text-2xl">document_scanner</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0b1c30]">Scan Study Notes</h3>
                <p className="text-xs text-[#464555]">Scan handwritten or printed lecture notes</p>
              </div>
            </div>

            {!fileSelected ? (
              <label className="border-2 border-dashed border-[#c7c4d8] hover:border-[#3525cd] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#f8f9ff] transition-colors mb-4">
                <span className="material-symbols-outlined text-4xl text-[#3525cd] mb-2">
                  photo_camera
                </span>
                <span className="text-sm font-semibold text-[#0b1c30]">
                  Snap photo or choose file
                </span>
                <span className="text-xs text-[#464555] mt-1">PNG, JPG, or PDF supported</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-[#eff4ff] p-4 rounded-2xl mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#0b1c30]">{fileSelected}</span>
                  <span className="text-xs font-semibold text-[#3525cd]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#d3e4fe] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3525cd] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                {processedSummary && (
                  <p className="text-xs text-[#464555] mt-3 whitespace-pre-line font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {processedSummary}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#3525cd] text-white font-semibold text-sm hover:bg-[#3525cd]/90 transition-all shadow-md"
            >
              Done
            </button>
          </div>
        )}

        {actionType === 'pdf' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffd8e7] flex items-center justify-center text-[#3d0026]">
                <span className="material-symbols-outlined text-2xl">upload_file</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0b1c30]">Upload PDF Syllabus / Paper</h3>
                <p className="text-xs text-[#464555]">Convert PDFs into summaries & flashcards</p>
              </div>
            </div>

            {!fileSelected ? (
              <label className="border-2 border-dashed border-[#c7c4d8] hover:border-[#3525cd] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#f8f9ff] transition-colors mb-4">
                <span className="material-symbols-outlined text-4xl text-[#712ae2] mb-2">
                  file_upload
                </span>
                <span className="text-sm font-semibold text-[#0b1c30]">
                  Select PDF Document
                </span>
                <span className="text-xs text-[#464555] mt-1">Up to 25MB per file</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-[#eff4ff] p-4 rounded-2xl mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#0b1c30]">{fileSelected}</span>
                  <span className="text-xs font-semibold text-[#3525cd]">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#d3e4fe] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3525cd] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                {processedSummary && (
                  <p className="text-xs text-[#464555] mt-3 whitespace-pre-line font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {processedSummary}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#3525cd] text-white font-semibold text-sm hover:bg-[#3525cd]/90 transition-all shadow-md"
            >
              Done
            </button>
          </div>
        )}

        {actionType === 'quiz' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#c7c4d8]/40 flex items-center justify-center text-[#0b1c30]">
                <span className="material-symbols-outlined text-2xl">quiz</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0b1c30]">AI Quiz Generator</h3>
                <p className="text-xs text-[#464555]">Generate a 5-question active-recall quiz</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Select Subject</label>
                <select className="w-full p-3 rounded-xl border border-slate-200 bg-[#f8f9ff] text-sm font-medium text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#3525cd]">
                  <option>Physics - Quantum Mechanics</option>
                  <option>Biology - Krebs Cycle & Cellular Respiration</option>
                  <option>Mathematics - Calculus Derivatives</option>
                  <option>Chemistry - Organic Reactions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0b1c30] mb-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="py-2 rounded-xl bg-[#4f46e5]/10 text-[#3525cd] font-bold text-xs border border-[#3525cd]">
                    Medium
                  </button>
                  <button className="py-2 rounded-xl bg-[#f8f9ff] text-[#464555] font-semibold text-xs border border-slate-200 hover:bg-slate-100">
                    Hard
                  </button>
                  <button className="py-2 rounded-xl bg-[#f8f9ff] text-[#464555] font-semibold text-xs border border-slate-200 hover:bg-slate-100">
                    Exam Mode
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Generating 5 active-recall quiz questions tailored to your performance...');
                onClose();
              }}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#3525cd] to-[#712ae2] text-white font-semibold text-sm hover:brightness-105 transition-all shadow-md"
            >
              Generate AI Quiz
            </button>
          </div>
        )}

        {actionType === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xl font-bold text-[#0b1c30]">Notifications</h3>
              <span className="text-xs bg-[#4f46e5]/10 text-[#3525cd] font-bold px-2.5 py-0.5 rounded-full">
                3 New
              </span>
            </div>

            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
              <div className="p-3 bg-[#eff4ff] rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[#712ae2] text-xl fill mt-0.5">
                  auto_awesome
                </span>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">AI Smart Tip Ready</p>
                  <p className="text-xs text-[#464555]">Time for a 5-min revision of Calculus. You're most focused right now!</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9ff] rounded-2xl flex items-start gap-3 border border-slate-100">
                <span className="material-symbols-outlined text-emerald-600 text-xl mt-0.5">
                  verified
                </span>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">7-Day Streak Achieved!</p>
                  <p className="text-xs text-[#464555]">Awesome consistency! You unlocked the Night Owl badge.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9ff] rounded-2xl flex items-start gap-3 border border-slate-100">
                <span className="material-symbols-outlined text-[#3525cd] text-xl mt-0.5">
                  schedule
                </span>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">Upcoming Exam Milestone</p>
                  <p className="text-xs text-[#464555]">Quantum Mechanics Final Exam in 8 Days.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Yesterday</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#3525cd] text-white font-semibold text-sm hover:bg-[#3525cd]/90 transition-all shadow-md"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
