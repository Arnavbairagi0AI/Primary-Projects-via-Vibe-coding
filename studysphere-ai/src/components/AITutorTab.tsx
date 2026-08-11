import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface AITutorTabProps {
  onOpenNotifications?: () => void;
}

export const AITutorTab: React.FC<AITutorTabProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I've indexed your latest Biology notes and the upcoming Physics exam. How can I help you study today?",
      timestamp: '10:00 AM'
    },
    {
      id: '2',
      sender: 'user',
      text: "Can you help me visualize the Krebs cycle? It's confusing.",
      timestamp: '10:01 AM'
    },
    {
      id: '3',
      sender: 'ai',
      text: "Absolutely! Think of the Krebs cycle like a factory line where energy is extracted from fuel. Let's break it down step-by-step:",
      diagramUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2-MAYZOkJNB8_bLw9pNhl7a1DY1t_9_zRhFwZ1zM7vz76aln-ZuxwlOa2xY0S2lthIXQueU_5fNMelh6ZO7u08iFvr0z-UwPMnU7LufufX64vZDSQwfiCJpsMpsN_dW5bIcqScBdaE8kGaO7pdIjU2tvvU_VqGTMocVncN1p_QlUqz-Ja7b9ylqDoOP1Y3nnEES5uDrM2aFt5VTOxofsLR9gyswRNDRWriRL_adrp2UsBTIFB-z_w',
      timestamp: '10:01 AM'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if ((!prompt.trim() && !selectedImage) || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputPrompt('');
    const imagePayload = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          image: imagePayload,
          history: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.text || 'I analyzed your query.',
        diagramUrl: data.diagramUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I'm having a slight connection moment, but let's review: Key study concepts can be tackled by breaking them down into active recall questions!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMicToggle = () => {
    setIsMicActive(!isMicActive);
    if (!isMicActive) {
      // Simulate speech recognition preview
      setTimeout(() => {
        setInputPrompt('Explain how mitochondria produce ATP during cellular respiration.');
        setIsMicActive(false);
      }, 3000);
    }
  };

  const actionChips = [
    { label: 'Explain photosynthesis', icon: 'nature_people' },
    { label: 'Solve this math problem', icon: 'calculate' },
    { label: 'Summarize my last note', icon: 'description' },
    { label: 'Quiz me on Quantum Physics', icon: 'quiz' }
  ];

  return (
    <div className="pt-20 pb-36 max-w-4xl mx-auto w-full px-4 md:px-8 flex flex-col min-h-screen">
      {/* AI Orb Hero Section */}
      <div className="relative flex flex-col items-center py-6 md:py-8">
        <div className="orb-glow absolute w-56 h-56 -top-4 pointer-events-none"></div>
        
        {/* Animated AI Orb Container */}
        <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center floating-art">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#3525cd] via-[#712ae2] to-[#8a4cfc] opacity-80 blur-md animate-pulse"></div>
          <div className="relative w-28 h-28 rounded-full bg-white/90 backdrop-blur-md border-2 border-white flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-5xl text-[#3525cd] fill">
              smart_toy
            </span>
          </div>
        </div>

        <div className="mt-4 text-center z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3525cd] tracking-tight">
            AI Tutor
          </h2>
          <p className="text-sm md:text-base text-[#464555] mt-1">
            Ready to explore your syllabus together?
          </p>
        </div>
      </div>

      {/* Conversation Messages */}
      <div className="flex-grow space-y-4 mb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 max-w-[90%] md:max-w-[80%] ${
              msg.sender === 'user' ? 'ml-auto justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-[#4f46e5]/20 flex items-center justify-center shrink-0 border border-[#3525cd]/10 shadow-xs">
                <span className="material-symbols-outlined text-[#3525cd] text-[18px] fill">
                  smart_toy
                </span>
              </div>
            )}

            <div
              className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#712ae2] text-white rounded-br-none shadow-md'
                  : 'ai-bubble text-[#0b1c30] rounded-bl-none border border-[#4f46e5]/15'
              }`}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded document"
                  className="w-full max-h-60 object-cover rounded-xl mb-3 border border-white/40"
                />
              )}

              <p className="whitespace-pre-line">{msg.text}</p>

              {msg.diagramUrl && (
                <div className="mt-3 bg-white/70 border border-white p-2.5 rounded-xl shadow-xs">
                  <img
                    src={msg.diagramUrl}
                    alt="Educational diagram"
                    className="w-full rounded-lg shadow-xs"
                  />
                  <p className="text-[11px] text-[#464555] text-center mt-2 font-medium">
                    Mitochondrion: The Krebs Cycle (Citric Acid Cycle)
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4f46e5]/20 flex items-center justify-center shrink-0 border border-[#3525cd]/10">
              <span className="material-symbols-outlined text-[#3525cd] text-[18px] fill animate-spin">
                auto_awesome
              </span>
            </div>
            <div className="ai-bubble px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3525cd] animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-[#712ae2] animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-[#8a4cfc] animate-bounce delay-200"></span>
              <span className="text-xs text-[#464555] font-medium ml-1">AI Tutor is formulating explanation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Chips */}
      <div className="flex overflow-x-auto gap-2.5 pb-2 hide-scrollbar mb-4">
        {actionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.label)}
            className="bg-[#eff4ff] border border-[#c7c4d8] hover:border-[#3525cd] px-3.5 py-2 rounded-full whitespace-nowrap text-[#464555] text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 shrink-0 shadow-2xs hover:bg-white"
          >
            <span className="material-symbols-outlined text-[16px] text-[#3525cd]">
              {chip.icon}
            </span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Pinned Input Bar */}
      <div className="fixed bottom-20 left-0 w-full px-4 md:px-8 py-2 z-30">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-2 relative inline-block bg-white p-1 rounded-xl shadow-md border border-slate-200">
              <img src={selectedImage} alt="Selected preview" className="h-16 w-16 object-cover rounded-lg" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
          )}

          <div className="glass-panel rounded-full shadow-lg p-1.5 flex items-center gap-2 ring-1 ring-black/5 bg-white/80">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#464555] hover:bg-[#eff4ff] transition-colors active:scale-90"
              title="Upload Image or Document"
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask your tutor anything..."
              className="flex-grow bg-transparent border-none focus:outline-none font-medium text-sm md:text-base text-[#0b1c30] px-2 h-11"
            />

            <div className="flex items-center gap-1 pr-1">
              <button
                onClick={handleMicToggle}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                  isMicActive
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : 'text-[#464555] hover:bg-[#eff4ff]'
                }`}
                title="Voice Input"
              >
                <span className="material-symbols-outlined">mic</span>
              </button>

              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputPrompt.trim() && !selectedImage) || isLoading}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#3525cd] text-white shadow-md hover:bg-[#3525cd]/90 transition-all active:scale-90 disabled:opacity-50"
                title="Send Message"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
