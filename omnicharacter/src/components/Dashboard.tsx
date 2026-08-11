/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Character, CreatorProfile, Conversation } from '../types';
import { CATEGORIES, INITIAL_CREATORS } from '../initialData';
import { 
  Search, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Flame, 
  MessageSquare, 
  Heart, 
  Plus, 
  FolderPlus, 
  CheckCircle, 
  ChevronRight, 
  Filter 
} from 'lucide-react';

interface DashboardProps {
  characters: Character[];
  conversations: Conversation[];
  activeUserId: string;
  onSelectCharacter: (char: Character) => void;
  onSelectConversation: (conv: Conversation) => void;
  onNavigateToCreate: () => void;
  onLikeCharacter: (id: string) => void;
}

export default function Dashboard({
  characters,
  conversations,
  activeUserId,
  onSelectCharacter,
  onSelectConversation,
  onNavigateToCreate,
  onLikeCharacter
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular');
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  useEffect(() => {
    // Only show unique conversations
    setRecentChats(conversations.slice(0, 5));
  }, [conversations]);

  // Filter & Sort Characters
  const filteredCharacters = characters.filter(char => {
    const matchesSearch = 
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'All' || char.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // popular
    return b.chatsCount - a.chatsCount;
  });

  const featuredCharacters = characters.slice(0, 3);
  const trendingCharacters = characters.slice().sort((a, b) => b.likesCount - a.likesCount).slice(0, 4);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Glass Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Empathetic AI Minds
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Meet Your Next <br />
            <span className="bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              Infinite Companion
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Experience highly-stylized roleplay, immersive gaming masters, coding mentors, and philosophical confidants. Fully synchronized with private long-term memories.
          </p>

          {/* Large Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search characters by name, traits, tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-teal-500 rounded-2xl text-white placeholder-slate-500 outline-none transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            <button 
              onClick={onNavigateToCreate}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-teal-500/15"
            >
              <Plus className="w-5 h-5" />
              Create Character
            </button>
          </div>
        </div>
      </div>

      {/* Continue Chatting Section */}
      {recentChats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Continue Chatting</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentChats.map(conv => {
              const char = characters.find(c => c.id === conv.characterId);
              if (!char) return null;
              return (
                <div 
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all duration-200 group relative"
                >
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors truncate">
                      {char.name}
                    </h3>
                    <p className="text-slate-500 text-xs truncate">
                      {conv.lastMessageText || char.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Grid (Elegant Bento Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Featured Characters</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featuredCharacters.map(char => (
              <div 
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className="group relative overflow-hidden rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-teal-500/40 cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Background effect */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full filter blur-xl" />
                
                <div className="flex items-start gap-4">
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    className="w-14 h-14 rounded-xl object-cover border border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {char.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                        ★ {char.rating || 4.8}
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                      {char.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {char.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/40 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {char.chatsCount.toLocaleString()} chats
                  </div>
                  <div className="flex items-center gap-1">
                    By {char.creatorName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Weekly Trending</h2>
          </div>

          <div className="space-y-3 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4">
            {trendingCharacters.map((char, idx) => (
              <div 
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/60 cursor-pointer transition-all duration-200 group"
              >
                <div className="font-mono text-sm font-extrabold text-slate-600 group-hover:text-teal-400 w-5">
                  0{idx + 1}
                </div>
                <img 
                  src={char.avatar} 
                  alt={char.name} 
                  className="w-10 h-10 rounded-lg object-cover border border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors truncate">
                    {char.name}
                  </h4>
                  <p className="text-slate-500 text-xs truncate">
                    {char.subtitle}
                  </p>
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {char.likesCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Filterable Discovery Area */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Explore AI Library</h2>
            <p className="text-slate-500 text-xs">Discover community creations across specialized categories</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <div className="flex bg-slate-900/60 rounded-xl p-1 border border-slate-800 text-xs">
              <button 
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${sortBy === 'popular' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Popular
              </button>
              <button 
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${sortBy === 'newest' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Newest
              </button>
              <button 
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${sortBy === 'rating' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Rating
              </button>
            </div>
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-white text-slate-950 border-white' 
                  : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Grid */}
        {filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-500">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white">No characters found</h3>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">Try refining your search terms or selecting another category.</p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCharacters.map(char => (
              <div 
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-slate-700/80 cursor-pointer p-4 transition-all duration-200"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 border border-slate-800/40">
                  <img 
                    src={char.avatar} 
                    alt={char.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-slate-300">
                    {char.category}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeCharacter(char.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-950/80 border border-slate-800/60 backdrop-blur-md hover:bg-slate-800 text-slate-400 hover:text-pink-500 rounded-lg transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100" />
                  </button>
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors truncate">
                    {char.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {char.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/40 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1 font-semibold">
                    💬 {char.chatsCount > 1000 ? `${(char.chatsCount / 1000).toFixed(1)}k` : char.chatsCount}
                  </div>
                  <div className="truncate max-w-[80px]">
                    by {char.creatorName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Creators Section */}
      <div className="space-y-4 pt-6 border-t border-slate-900">
        <h2 className="text-lg font-bold text-white tracking-tight">Featured AI Creators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {INITIAL_CREATORS.map(creator => (
            <div 
              key={creator.uid}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800"
            >
              <img 
                src={creator.avatar} 
                alt={creator.displayName} 
                className="w-11 h-11 rounded-full object-cover border border-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm truncate">{creator.displayName}</h3>
                  <CheckCircle className="w-4 h-4 text-teal-400 fill-teal-400/10 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate">{creator.followersCount.toLocaleString()} followers</p>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{creator.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
