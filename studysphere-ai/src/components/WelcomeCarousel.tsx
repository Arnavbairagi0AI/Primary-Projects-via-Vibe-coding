import React, { useState } from 'react';

interface WelcomeCarouselProps {
  onComplete: () => void;
  onLogin?: () => void;
}

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ onComplete, onLogin }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: 'Personal AI Tutor',
      description: 'Get instant, 24/7 help with any subject. Our AI understands your learning style and adapts to your pace.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDN-3p_-YisIFsxEq1UbsyszNcYwbWyHeS66YyvCHFp21dd_LHbyNsG4JE0Tn-xsJbt_YTk9ywxeT_n0t_vWvcoxpE51IiXliBjtxsUB5b4cBs-JlLWt0QUjKr7__GgGIt7uK54AxXyX3rPttNP0UpSHE-YH-UYN14zk9oy3QxozbYNnOPAisqkG57HDNXqW6FXLZ1tnSXrZlO8WMO7nEMOdyNxzwno0h-buZFLAi1UsNY-1ZYjhcQy',
      bgGradient: 'from-[#4f46e5]/20 to-[#8a4cfc]/20',
      alt: '3D AI avatar in a minimalist study space'
    },
    {
      id: 1,
      title: 'Smart Notes',
      description: 'Upload PDFs or lecture recordings and watch them transform into concise summaries and active-recall flashcards.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsF-sNrhFBOP_HwtaOqy-P93ytJtN8Fc4O7ql7mQt4I43s2p-7wZ1WkgHLBE6dU8zMDJ0UG2xy4DGfXX42pwfW2LBTmS1zrJx50eUaUyfriayXgJyNY6Xe4qv1JfVMuTpkdEyeIBMo7VYozxHQ7YvMxfAmWq9gmhCku1haBmvd4zvP4LEh4u2uL0a6rF4dPmVhFWbBYBLVOQe5klSoB0T0Ef4qFBI_kW3jjJAqo7grCDLbOlPU_ROi',
      bgGradient: 'from-[#a63274]/10 to-[#4f46e5]/20',
      alt: 'Digital documents and PDFs turning into data crystals'
    },
    {
      id: 2,
      title: 'Exam Planner',
      description: 'Master your schedule with AI-optimized study sessions. We calculate exactly when and what to study to ace your goals.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-YKQJfoNDntKCiPte2_tH1V_WhTnnWGMDJqBCZ2u_DE9uTmOORgXmLSlrl6mM8tbW7rjNs-fPKkRTVLjOkbsGGgAiLQKsxi95Tx8X0hP--Ei-KXPXdID0TrL8C3T0SNco1OeS0RtJWqpMl41H10wkYsuvTf2YH-nZ5EeFL0bqXCc1uukcXFnyt-06Xiy4gUesXyxvmqwHY72imiEnAO4vjikhTz_C2_mZUU0vPC6JTH7pyrOk-r5h',
      bgGradient: 'from-[#8a4cfc]/20 to-[#3525cd]/10',
      alt: 'Calendar and schedule visualization with violet nodes'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9ff] flex flex-col justify-between max-w-md mx-auto overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="pt-8 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 mx-auto">
          <span className="material-symbols-outlined text-[#3525cd] text-[32px] fill">auto_awesome</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#3525cd]">StudySphere AI</h1>
        </div>
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 text-sm text-[#464555] hover:text-[#3525cd] font-semibold py-1 px-3 rounded-full bg-white/60 backdrop-blur-xs border border-slate-200"
        >
          Skip
        </button>
      </header>

      {/* Main Content Step */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-4">
        <div className="w-full aspect-square max-w-[320px] rounded-2xl bg-gradient-to-br p-4 flex items-center justify-center floating-art transition-all duration-500 shadow-sm border border-white/60">
          <img 
            src={steps[currentStep].image} 
            alt={steps[currentStep].alt}
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <div className="mt-8 text-center max-w-sm">
          <h2 className="text-2xl font-bold text-[#0b1c30] mb-3">
            {steps[currentStep].title}
          </h2>
          <p className="text-[#464555] text-base leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Pagination & Footer Actions */}
      <footer className="pb-8 px-6 mt-4 space-y-4">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === step.id
                  ? 'w-6 bg-[#3525cd]'
                  : 'w-2 bg-[#c7c4d8]'
              }`}
              aria-label={`Go to slide ${step.id + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#3525cd] to-[#712ae2] text-white font-semibold text-base shadow-lg shadow-[#3525cd]/25 active:scale-95 transition-transform flex items-center justify-center gap-2 hover:brightness-105"
        >
          <span>{currentStep === 2 ? 'Get Started' : 'Continue'}</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[#c7c4d8]/40"></div>
          <span className="flex-shrink mx-4 text-xs font-medium text-[#464555]">or continue with</span>
          <div className="flex-grow border-t border-[#c7c4d8]/40"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={onComplete}
            className="flex-1 h-12 glass-panel rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all border border-slate-200"
          >
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyHfHRYJ_S-eKIDNdXGzwuj0ICBmBN8BFwEmrth3K-NqpNKugQg4_wBHNXvfYgnsjVlUU56OyRR7uReLCgHMCKamaCje4OQc5_wZVt0sOfUO6WkfmVWhjrh8dJuMWGB0e-bodPPoNp1xWK04rdV8xiOiq4hfol-w86IlMltxlPD95RIvowWkuyua2VSJYcyLG27rNtYh1dz6L_LawkFvDgvVtaabVWikCE3Yvo9sWyF9XTVgnU8ZiL" 
              alt="Google" 
              className="w-5 h-5"
            />
            <span className="font-semibold text-sm text-[#0b1c30]">Google</span>
          </button>

          <button 
            onClick={onComplete}
            className="flex-1 h-12 glass-panel rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all border border-slate-200"
          >
            <span className="material-symbols-outlined text-[20px] text-[#0b1c30]">file_download</span>
            <span className="font-semibold text-sm text-[#0b1c30]">Apple</span>
          </button>
        </div>

        <p className="text-center text-xs text-[#464555] pt-2">
          Already have an account?{' '}
          <button 
            onClick={onLogin || onComplete} 
            className="text-[#3525cd] font-bold hover:underline"
          >
            Log in
          </button>
        </p>
      </footer>
    </div>
  );
};
