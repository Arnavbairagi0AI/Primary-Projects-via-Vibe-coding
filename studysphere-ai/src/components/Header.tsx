import React from 'react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenOnboarding: () => void;
  title?: string;
  subtitle?: string;
  userImage?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenOnboarding,
  userImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Ov8Cqh6lo3UHPyn-YBT5Jvf32ActSZzdtDVvuTNGCiDO5-ND9XlTpxMS4FgzXSKxckA6NGRnSA8BERTRlj8fddfXtoVCEsHim5RkX0KApWXsAzumMAfGPQedvelRPPm-nre6iDzlleckI9gnBbjgPFsd6_m-HuP-caRg3ZvBIPOTdWLCw4MqF170oszfppDfur8zH4oLa1052mEte_RDfAl_cmtrovJLflTc9k_s700DXE6myagm'
}) => {
  return (
    <header className="fixed top-0 w-full z-40 glass-header shadow-sm border-b border-white/20 flex justify-between items-center px-4 md:px-12 py-3">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenOnboarding} 
          className="w-10 h-10 rounded-full bg-[#4f46e5]/15 flex items-center justify-center hover:bg-[#4f46e5]/25 transition-colors group"
          title="View Welcome Tour"
        >
          <span className="material-symbols-outlined text-[#3525cd] text-2xl group-hover:scale-110 transition-transform">school</span>
        </button>
        <h1 className="font-bold text-xl md:text-2xl text-[#3525cd] tracking-tight">StudySphere AI</h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onOpenNotifications}
          className="p-2 rounded-full hover:bg-[#3525cd]/10 transition-colors active:scale-95 text-[#464555] relative"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-2xl">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#712ae2] rounded-full ring-2 ring-white"></span>
        </button>

        <button 
          onClick={onOpenOnboarding}
          className="w-10 h-10 rounded-full border-2 border-[#3525cd]/30 overflow-hidden hover:opacity-90 transition-opacity active:scale-95 shadow-sm"
          title="Account Profile"
        >
          <img 
            src={userImage} 
            alt="User profile" 
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
