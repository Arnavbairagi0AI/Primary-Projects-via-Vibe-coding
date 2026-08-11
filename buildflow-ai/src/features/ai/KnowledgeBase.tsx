import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Award, 
  FileCheck, 
  FolderLock,
  Building2
} from 'lucide-react';

export default function KnowledgeBase() {
  const { user } = { user: useAuth().user };
  const { showToast } = useToast();

  const [kbItems, setKbItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Experience Certificate');
  const [content, setContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Stream items from Firestore
  useEffect(() => {
    if (!user || !user.companyId) return;

    const q = query(collection(db, 'knowledgeBase'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setKbItems(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to load knowledgeBase stream:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast("Please enter a title and detail description.", "error");
      return;
    }

    try {
      await addDoc(collection(db, 'knowledgeBase'), {
        companyId: user?.companyId,
        userId: user?.id,
        title,
        category,
        content,
        timestamp: new Date().toISOString()
      });
      setTitle('');
      setContent('');
      setShowAddForm(false);
      showToast("Knowledge asset recorded in secure cloud vault!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save knowledge asset.", "error");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'knowledgeBase', id));
      showToast("Knowledge asset removed.", "info");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete knowledge asset.", "error");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Add Button */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Company Knowledge Vault</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Cancel Add' : 'Register Asset'}
        </button>
      </div>

      {/* Add Asset Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 max-w-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">New Knowledge Asset</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Title / Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 50-Span Precast Viaduct Certificate"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold outline-none placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classification Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold outline-none cursor-pointer"
              >
                <option value="Experience Certificate">Experience Certificate</option>
                <option value="Corporate Credential">Corporate Credential</option>
                <option value="ISO & Safety License">ISO & Safety License</option>
                <option value="Financial Solvency Record">Financial Solvency Record</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Contents / Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide exact values, cert numbers, state boundaries, or past structural values to assist Gemini context grounding..."
              rows={4}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold outline-none resize-none placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Record Asset
          </button>
        </form>
      )}

      {/* Grid of Knowledge Assets */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-600 animate-pulse">Syncing with cloud vault...</div>
      ) : kbItems.length === 0 ? (
        <div className="py-12 border border-dashed border-slate-800 rounded-3xl text-center space-y-2 max-w-lg mx-auto">
          <FolderLock className="w-10 h-10 text-slate-700 mx-auto" />
          <h4 className="text-slate-300 font-bold text-sm">Vault is Empty</h4>
          <p className="text-xs text-slate-500">
            Register your safety ISO licenses, experience certificates, and bank solvency parameters to allow Gemini to ground prequalifications accurately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kbItems.map((item) => (
            <div key={item.id} className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 group relative">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.category === 'Experience Certificate' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                    item.category === 'ISO & Safety License' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {item.category}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-xs font-black text-slate-200">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 whitespace-pre-line">{item.content}</p>
              </div>
              <div className="text-[10px] text-slate-600 font-bold uppercase border-t border-slate-800/50 pt-2 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Active Knowledge Asset
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
