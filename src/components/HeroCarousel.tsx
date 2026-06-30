/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem, TranslationSchema } from '../types';

interface HeroCarouselProps {
  t: TranslationSchema;
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
}

export default function HeroCarousel({ t, items, onPlay, onOpenDetails }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Filter items that make great featured highlights (typically movies, top ranks or just first items)
  const featuredItems = items.filter(i => i.type === 'movie' || i.top10Rank !== undefined).slice(0, 3);
  const activeItem = featuredItems[activeIndex] || items[0];

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredItems.length);
    }, 8000); // 8s auto-rotate
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  if (!activeItem) return null;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  return (
    <div id="hero-carousel" className="relative w-full h-[65vh] sm:h-[75vh] md:h-[80vh] bg-[#050507] overflow-hidden select-none">
      
      {/* Background Image backdrop with premium vignettes */}
      <div className="absolute inset-0 transition-all duration-1000 ease-in-out">
        <img
          src={activeItem.posterUrl}
          alt={activeItem.title}
          className="w-full h-full object-cover object-top scale-105 filter brightness-[0.45] saturate-110"
          referrerPolicy="no-referrer"
        />
        {/* Ambient Overlay Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/20 to-[#050507]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-transparent to-[#050507]/20" />
      </div>

      {/* Floating neon accent */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent pointer-events-none" />

      {/* Hero Content Information */}
      <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 lg:px-12 pb-12 sm:pb-16 md:pb-24 max-w-4xl">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
          
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            {activeItem.top10Rank && (
              <span className="bg-amber-500/25 border border-amber-500/55 text-amber-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md shadow-amber-500/5">
                Top {activeItem.top10Rank}
              </span>
            )}
            <span className="bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
              {activeItem.rating} ⭐
            </span>
            {activeItem.duration && (
              <span className="text-zinc-400 text-xs font-medium font-sans">
                {activeItem.duration}
              </span>
            )}
            {activeItem.newSeasonSoon && (
              <span className="bg-rose-950/80 border border-rose-900/80 text-rose-300 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                New Season
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-sans font-extrabold text-white tracking-tight leading-tight">
            {activeItem.title}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-zinc-300/90 leading-relaxed font-sans max-w-2xl line-clamp-3 shadow-sm">
            {activeItem.description}
          </p>

          {/* Genres row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeItem.genres.map((g) => (
              <span key={g} className="text-zinc-500 text-xs font-mono">
                #{g}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-4">
            <button
              onClick={() => onPlay(activeItem)}
              className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-indigo-500 text-white hover:brightness-110 px-6 sm:px-8 py-3 rounded-xl font-sans font-semibold text-sm transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-neon-cyan/20 cursor-pointer"
            >
              <Play className="w-4.5 h-4.5 fill-current text-white" />
              <span>{t.heroPlay}</span>
            </button>
            
            <button
              onClick={() => onOpenDetails(activeItem)}
              className="flex items-center gap-2 btn-glass px-6 sm:px-8 py-3 rounded-xl font-sans font-medium text-sm transition duration-150 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Info className="w-4.5 h-4.5" />
              <span>{t.heroMoreInfo}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Manual slide selectors */}
      {featuredItems.length > 1 && (
        <>
          {/* Chevron controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition duration-150 z-10 hidden sm:block cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition duration-150 z-10 hidden sm:block cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator dots */}
          <div className="absolute right-4 sm:right-8 bottom-12 flex items-center gap-2.5 z-10">
            {featuredItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === idx ? 'w-7 bg-neon-cyan shadow-md shadow-neon-cyan/20' : 'w-2.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
