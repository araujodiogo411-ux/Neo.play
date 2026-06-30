/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, Download, AlertTriangle, Sparkles, MessageSquare, Send, Bot } from 'lucide-react';
import { MediaItem, TranslationSchema, Profile, Episode } from '../types';

interface MovieDetailsProps {
  t: TranslationSchema;
  item: MediaItem;
  onClose: () => void;
  onPlay: (item: MediaItem, episode?: Episode) => void;
  watchlist: string[];
  toggleWatchlist: (id: string) => void;
  downloads: string[];
  toggleDownload: (id: string) => void;
  watchHistoryTitles: string[];
  language: string;
}

export default function MovieDetails({
  t,
  item,
  onClose,
  onPlay,
  watchlist,
  toggleWatchlist,
  downloads,
  toggleDownload,
  watchHistoryTitles,
  language,
}: MovieDetailsProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'episodes' | 'ai'>('info');
  
  // AI Curator states
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const isInWatchlist = watchlist.includes(item.id);
  const isDownloaded = downloads.includes(item.id);

  // Automatically default to episodes tab if series
  useEffect(() => {
    if (item.type === 'series') {
      setActiveTab('episodes');
      if (item.seasons && item.seasons.length > 0) {
        const sorted = [...item.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
        setSelectedSeason(sorted[0].seasonNumber);
      }
    } else {
      setActiveTab('info');
    }
  }, [item]);

  // Handle asking AI curator
  const handleAskAi = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() && !customPrompt) return;

    setIsLoadingAi(true);
    setAiResponse('');

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          currentMovie: {
            title: item.title,
            description: item.description,
            genres: item.genres,
            rating: item.rating,
          },
          watchHistoryTitles,
          language,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiResponse(data.text);
      } else {
        setAiResponse('Ocorreu um erro ao obter recomendações. Tente novamente.');
      }
    } catch (err) {
      console.error('Error contacting AI curator:', err);
      setAiResponse('Desculpe, não conseguimos conectar à Inteligência Artificial neste momento.');
    } finally {
      setIsLoadingAi(false);
      setPrompt('');
    }
  };

  // Pre-seed some smart quick question suggestions
  const quickPromptsMap: Record<string, string[]> = {
    'pt-BR': [
      `Gostei de "${item.title}". O que assistir a seguir?`,
      `Me sugira um filme com enredo parecido`,
      `Por que este título está no Top 10?`
    ],
    'pt-PT': [
      `Gostei de "${item.title}". O que assistir a seguir?`,
      `Sugira-me um filme com enredo parecido`,
      `Porque é que este título está no Top 10?`
    ],
    'en': [
      `I liked "${item.title}". What should I watch next?`,
      `Suggest a movie with a similar plot`,
      `Why is this title in the Top 10?`
    ],
    'es': [
      `Me gustó "${item.title}". ¿Qué debería ver después?`,
      `Sugiere una película con trama similar`,
      `¿Por qué este título está en el Top 10?`
    ],
    'zh': [
      `我喜欢《${item.title}》，接下来看什么？`,
      `推荐一部剧情类似的影片`,
      `为什么这部影片能进入 Top 10 榜单？`
    ]
  };

  const quickPrompts = quickPromptsMap[language] || quickPromptsMap['en'];

  return (
    <div 
      id="movie-details-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-[15px] flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Panel */}
        <div className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] bg-zinc-900">
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover object-top filter brightness-[0.5] saturate-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/20 to-transparent" />

          {/* Core Title overlay inside hero */}
          <div className="absolute bottom-6 left-6 right-6">
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-sans font-extrabold text-white tracking-tight">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm font-medium text-zinc-300">
              <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-neon-cyan font-mono font-bold">★ {item.rating}</span>
              {item.duration && <span>{item.duration}</span>}
              <span className="bg-white/5 px-2.5 py-0.5 rounded-full text-zinc-300 uppercase tracking-widest text-[10px] font-mono border border-white/10">
                {item.type === 'movie' ? 'Filme' : 'Série'}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Navigation Tab Headers */}
        <div className="flex border-b border-white/10 px-6 bg-white/5">
          {item.type === 'series' && (
            <button
              onClick={() => setActiveTab('episodes')}
              className={`py-4 px-3 text-sm font-sans font-medium transition-all relative cursor-pointer ${
                activeTab === 'episodes' ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.detailsEpisodes}
              {activeTab === 'episodes' && <div className="absolute bottom-0 left-0 w-full h-1 bg-neon-cyan rounded-t" />}
            </button>
          )}
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-3 text-sm font-sans font-medium transition-all relative cursor-pointer ${
              activeTab === 'info' ? 'text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {item.type === 'movie' ? 'Informações' : 'Sinopse'}
            {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-1 bg-neon-cyan rounded-t" />}
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              // Automatically request initial AI analysis if empty
              if (!aiResponse) {
                handleAskAi(undefined, `Me dê um sumário premium deste título e diga o que o torna único!`);
              }
            }}
            className={`py-4 px-3 text-sm font-sans font-medium transition-all flex items-center gap-1.5 relative cursor-pointer ${
              activeTab === 'ai' ? 'text-neon-cyan font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
            <span>Curador Inteligente</span>
            {activeTab === 'ai' && <div className="absolute bottom-0 left-0 w-full h-1 bg-neon-cyan rounded-t" />}
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 md:p-8 max-h-[300px] sm:max-h-[380px] overflow-y-auto scrollbar-thin">
          
          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-sans">
                {item.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm border-t border-white/10 pt-5">
                <div className="space-y-2">
                  <p className="font-sans text-zinc-500 font-medium">
                    <span className="text-zinc-400 font-semibold">{t.detailsGenres}</span> {item.genres.join(', ')}
                  </p>
                  {item.releaseDate && (
                    <p className="font-sans text-zinc-500 font-medium">
                      <span className="text-zinc-400 font-semibold">{t.detailsRelease}</span> {item.releaseDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {item.duration && (
                    <p className="font-sans text-zinc-500 font-medium">
                      <span className="text-zinc-400 font-semibold">{t.detailsDuration}</span> {item.duration}
                    </p>
                  )}
                  {item.newSeasonSoon && (
                    <p className="text-rose-400 font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                      {t.detailsNewSeasonSoon}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Rows */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {item.type === 'movie' && (
                  <button
                    onClick={() => onPlay(item)}
                    className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-indigo-500 hover:brightness-110 text-white font-sans font-semibold text-sm px-7 py-3 rounded-xl shadow-lg shadow-neon-cyan/20 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current text-white" />
                    <span>{t.heroPlay}</span>
                  </button>
                )}

                <button
                  onClick={() => toggleWatchlist(item.id)}
                  className="flex items-center gap-2 btn-glass px-5 py-3 rounded-xl text-xs font-sans font-medium transition cursor-pointer"
                >
                  {isInWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                  <span>{isInWatchlist ? t.detailsRemoveFromMyList : t.detailsAddToMyList}</span>
                </button>

                <button
                  onClick={() => toggleDownload(item.id)}
                  className="flex items-center gap-2 btn-glass px-5 py-3 rounded-xl text-xs font-sans font-medium transition cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${isDownloaded ? 'text-neon-cyan' : ''}`} />
                  <span>{isDownloaded ? t.detailsDownloaded : t.detailsDownload}</span>
                </button>
              </div>
            </div>
          )}

          {/* EPISODES TAB (For Series) */}
          {activeTab === 'episodes' && item.type === 'series' && item.seasons && (
            <div className="space-y-6">
              {/* Season Selection Header */}
              {item.seasons.length > 1 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">{t.detailsSeasons}</span>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-sans outline-none cursor-pointer"
                  >
                    {item.seasons.map((s) => (
                      <option key={s.seasonNumber} value={s.seasonNumber} className="bg-[#050507] text-zinc-200">
                        {t.detailsSeasonCount} {s.seasonNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Episodes List Grid */}
              <div className="space-y-4">
                {item.seasons
                  .find((s) => s.seasonNumber === selectedSeason)
                  ?.episodes.map((ep) => (
                    <div 
                      key={ep.id}
                      onClick={() => onPlay(item, ep)}
                      className="group flex flex-col sm:flex-row items-start gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 cursor-pointer transition duration-200"
                    >
                      {/* Ep Thumbnail Cover */}
                      <div className="relative shrink-0 w-full sm:w-36 aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-white/10 group-hover:border-neon-cyan transition-colors">
                        <img
                          src={ep.thumbnailUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 flex items-center justify-center transition">
                          <Play className="w-8 h-8 p-2 bg-white/10 group-hover:bg-white text-zinc-100 group-hover:text-zinc-950 rounded-full backdrop-blur-sm transition" />
                        </div>
                      </div>

                      {/* Ep Metadata details */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-sans font-bold text-zinc-100 group-hover:text-neon-cyan transition">
                            {ep.episodeNumber}. {ep.title}
                          </h4>
                          <span className="text-xs font-mono text-zinc-500">{ep.duration}</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-2">
                          {ep.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AI RECOMMENDATIONS TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Bot Introductions */}
              <div className="flex items-start gap-3 bg-neon-purple/10 border border-neon-purple/20 p-4 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-neon-purple" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-sans font-bold text-neon-purple">Curador IA CineNeo</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {t.detailsAiIntro}
                  </p>
                </div>
              </div>

              {/* Bot Response Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                {isLoadingAi ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500 font-sans">{t.detailsAiAnalyzing}</span>
                  </div>
                ) : aiResponse ? (
                  <div className="text-sm text-zinc-300 leading-relaxed font-sans space-y-2 whitespace-pre-wrap">
                    {aiResponse}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-600 text-xs font-sans">
                    Como posso ajudar você hoje? Clique em um dos atalhos abaixo ou escreva sua mensagem!
                  </div>
                )}

                {/* Quick Prompts list */}
                {!isLoadingAi && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 mt-4">
                    {quickPrompts.map((pText, i) => (
                      <button
                        key={i}
                        onClick={() => handleAskAi(undefined, pText)}
                        className="text-[10px] sm:text-xs btn-glass text-zinc-400 hover:text-neon-cyan px-3 py-1.5 rounded-full transition text-left cursor-pointer"
                      >
                        {pText}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Chat bar */}
              <form onSubmit={handleAskAi} className="flex gap-2.5">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.detailsAiPromptPlaceholder}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-neon-cyan rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition font-sans"
                  disabled={isLoadingAi}
                />
                <button
                  type="submit"
                  disabled={isLoadingAi || !prompt.trim()}
                  className="bg-gradient-to-r from-neon-cyan to-neon-purple hover:brightness-110 disabled:opacity-50 text-white p-3 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
