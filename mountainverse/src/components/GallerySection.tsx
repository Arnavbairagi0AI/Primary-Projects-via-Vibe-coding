import React, { useState } from 'react';
import { MOUNTAINS } from '../data/mountains';
import { Sparkles, Maximize2, X } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const galleryItems = MOUNTAINS.flatMap((m) =>
    m.galleryImages.map((img) => ({
      url: img,
      mountainName: m.name,
      continent: m.continent
    }))
  );

  return (
    <section id="gallery" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> High-Resolution Alpine Photography
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Cinematic <span className="font-serif italic font-light text-amber-300">Mountain Gallery</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Glacier crevasses, alpine dawns, serrated ridges, and sacred summit panoramas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryItems.slice(0, 12).map((item, i) => (
            <div
              key={i}
              onClick={() => setSelectedImage(item.url)}
              className="group relative h-60 rounded-2xl overflow-hidden glass border border-white/10 hover:border-amber-400/50 cursor-pointer shadow-2xl transition-all"
            >
              <img src={item.url} alt={item.mountainName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div>
                  <span className="text-xs font-bold text-white block">{item.mountainName}</span>
                  <span className="text-[10px] text-amber-300">{item.continent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={selectedImage} alt="Expanded View" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      )}
    </section>
  );
};
