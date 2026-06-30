/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Eye, Calendar, Clock, AlertCircle } from 'lucide-react';
import { MediaItem, TranslationSchema } from '../types';

interface MovieRowProps {
  t: TranslationSchema;
  title: string;
  items: MediaItem[];
  onOpenDetails: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  isTop10?: boolean;
}

export default function MovieRow({ t, title, items, onOpenDetails, onPlay, isTop10 = false }: MovieRowProps) {
  if (items.length === 0) return null;

  return (
    <div id={`movie-row-${title.toLowerCase().replace(/\s+/g, '-')}`} className="py-6 space-y-4 select-none relative">
      <h3 className="text-lg md:text-xl font-sans font-bold text-white px-4 sm:px-6 lg:px-8 tracking-tight">
        {title}
      </h3>

      {/* Horizontal Scroll Area */}
      <div className="w-full overflow-x-auto scrollbar-none flex items-center gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 pb-4">
        {items.map((item, idx) => {
          if (isTop10) {
            return (
              <Top10Card
                key={item.id}
                t={t}
                item={item}
                rank={item.top10Rank || (idx + 1)}
                onOpenDetails={onOpenDetails}
                onPlay={onPlay}
              />
            );
          }
          return (
            <StandardCard
              key={item.id}
              t={t}
              item={item}
              onOpenDetails={onOpenDetails}
              onPlay={onPlay}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ------------------- STANDARD MOVIE CARD ------------------- */
interface CardProps {
  key?: string;
  t: TranslationSchema;
  item: MediaItem;
  onOpenDetails: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
}

function StandardCard({ t, item, onOpenDetails, onPlay }: CardProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isReleased, setIsReleased] = useState(true);

  // Check Expiration Scheduled date to display "Saída em breve"
  const isLeavingSoon = (() => {
    if (!item.scheduledExpirationDate) return false;
    const expDate = new Date(item.scheduledExpirationDate + 'T00:00:00');
    const now = new Date('2026-06-30T07:46:44-07:00'); // current mock time
    const diff = expDate.getTime() - now.getTime();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000; // Leaving within 30 days
  })();

  // Calculate Countdown if future releaseDate is set
  useEffect(() => {
    if (!item.releaseDate) {
      setIsReleased(true);
      return;
    }

    const targetDate = new Date(item.releaseDate + 'T00:00:00');
    const now = new Date('2026-06-30T07:46:44-07:00'); // current mock time

    if (targetDate.getTime() > now.getTime()) {
      setIsReleased(false);
      
      const calculate = () => {
        const currentNow = new Date(); // live countdown offset from base
        // To make the countdown look active in the preview, we tick relative to actual page load time
        // or just let it tick down
        const diff = targetDate.getTime() - new Date('2026-06-30T07:46:44-07:00').getTime();
        
        // We'll update relative to a static offset to ensure stability of current local time 2026-06-30
        const staticDiff = targetDate.getTime() - new Date('2026-06-30T07:46:44-07:00').getTime();
        if (staticDiff <= 0) {
          setIsReleased(true);
          setTimeLeft(null);
          return;
        }

        const d = Math.floor(staticDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((staticDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((staticDiff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((staticDiff % (1000 * 60)) / 1000);
        
        setTimeLeft({ d, h, m, s });
      };

      calculate();
      const interval = setInterval(calculate, 1000);
      return () => clearInterval(interval);
    } else {
      setIsReleased(true);
    }
  }, [item.releaseDate]);

  return (
    <div 
      className="relative shrink-0 w-36 sm:w-44 md:w-52 h-52 sm:h-64 md:h-76 rounded-2xl glass-panel hover:border-neon-cyan overflow-hidden group cursor-pointer transition duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-neon-cyan/20"
      onClick={() => onOpenDetails(item)}
    >
      <img
        src={item.posterUrl}
        alt={item.title}
        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />

      {/* Exiting Soon Tag */}
      {isLeavingSoon && (
        <span className="absolute top-2 left-2 bg-rose-600/90 border border-rose-500 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md text-white uppercase tracking-wider z-10 shadow-sm shadow-rose-900/50">
          {t.detailsExitingSoon}
        </span>
      )}

      {/* Future Release Countdown Overlay */}
      {!isReleased && timeLeft && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-3 text-center z-10 transition">
          <Calendar className="w-6 h-6 text-neon-cyan mb-1.5 animate-bounce" />
          <span className="text-[10px] font-sans text-zinc-400 font-semibold">{t.detailsReleaseCountdown}</span>
          <div className="flex items-center gap-1 mt-1 text-xs font-mono text-zinc-100 font-bold bg-[#050507]/90 border border-white/10 px-2.5 py-1 rounded-xl">
            <span>{timeLeft.d}{t.days}</span>
            <span>{timeLeft.h}{t.hours}</span>
            <span>{timeLeft.m}{t.minutes}</span>
          </div>
          <span className="mt-3 text-[10px] font-sans font-medium text-neon-cyan border border-neon-cyan/45 bg-neon-cyan/10 px-2 py-0.5 rounded-full hover:bg-neon-cyan/20 transition">
            Ver Trailer
          </span>
        </div>
      )}

      {/* New Season Soon Tag */}
      {item.newSeasonSoon && (
        <span className="absolute top-2 right-2 bg-neon-purple/90 border border-neon-purple/55 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md text-white uppercase tracking-wider z-10 animate-pulse">
          S2 Breve
        </span>
      )}

      {/* Hover Information Backdrop Overlay */}
      {isReleased && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-sans font-bold text-white leading-snug line-clamp-1">{item.title}</h4>
          
          <div className="flex items-center justify-between mt-1 sm:mt-1.5 text-[10px] font-mono text-zinc-400">
            <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300">★ {item.rating}</span>
            <span>{item.type === 'movie' ? 'Filme' : 'Série'}</span>
          </div>

          <div className="flex gap-2 mt-3.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="flex-1 bg-gradient-to-r from-neon-cyan to-indigo-500 hover:brightness-110 text-white rounded-lg py-1.5 flex items-center justify-center gap-1 text-[11px] font-sans font-semibold transition shadow-md shadow-neon-cyan/10 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-white" />
              <span>Play</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(item);
              }}
              className="px-2.5 btn-glass rounded-lg text-white transition flex items-center justify-center cursor-pointer"
              title="Info"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------- TOP 10 CARD ROW ------------------- */
interface Top10CardProps {
  key?: string;
  t: TranslationSchema;
  item: MediaItem;
  rank: number;
  onOpenDetails: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
}

function Top10Card({ t, item, rank, onOpenDetails, onPlay }: Top10CardProps) {
  return (
    <div 
      className="shrink-0 flex items-end relative w-48 sm:w-56 md:w-64 h-52 sm:h-64 md:h-76 overflow-visible select-none group cursor-pointer"
      onClick={() => onOpenDetails(item)}
    >
      {/* Huge Rank Number */}
      <div className="absolute left-[-15px] bottom-[-20px] text-[120px] sm:text-[150px] md:text-[180px] font-extrabold font-sans leading-none rank-stroke select-none z-10 transition-transform duration-300 group-hover:scale-105">
        {rank}
      </div>

      {/* Poster Cover Card offset to the right */}
      <div className="relative ml-14 sm:ml-20 md:ml-24 w-full h-full rounded-2xl glass-panel group-hover:border-neon-cyan overflow-hidden transition duration-300 transform group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-neon-cyan/20">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Hover overlay details */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 sm:p-4 z-20">
          <h4 className="text-xs sm:text-sm font-sans font-bold text-white leading-snug line-clamp-1">{item.title}</h4>
          
          <div className="flex items-center justify-between mt-1 sm:mt-1.5 text-[10px] font-mono text-zinc-400">
            <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-zinc-300">★ {item.rating}</span>
            <span>TOP {rank}</span>
          </div>

          <div className="flex gap-2 mt-3.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="flex-1 bg-gradient-to-r from-neon-cyan to-indigo-500 hover:brightness-110 text-white rounded-lg py-1.5 flex items-center justify-center gap-1 text-[11px] font-sans font-semibold transition shadow-md shadow-neon-cyan/10 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-white" />
              <span>Play</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(item);
              }}
              className="px-2.5 btn-glass rounded-lg text-white transition flex items-center justify-center cursor-pointer"
              title="Info"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
