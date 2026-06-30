/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, FastForward, Film, Star } from 'lucide-react';
import { MediaItem, Episode, TranslationSchema } from '../types';

interface VideoPlayerProps {
  t: TranslationSchema;
  item: MediaItem;
  episode?: Episode;
  onClose: () => void;
  nextEpisode?: Episode;
  onPlayNextEpisode?: (ep: Episode) => void;
  allCatalogItems: MediaItem[];
  onPlayRecommended?: (item: MediaItem) => void;
}

export default function VideoPlayer({
  t,
  item,
  episode,
  onClose,
  nextEpisode,
  onPlayNextEpisode,
  allCatalogItems,
  onPlayRecommended,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player Controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // End of video flows
  const [videoEnded, setVideoEnded] = useState(false);
  const [nextEpCountdown, setNextEpCountdown] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);

  // Video URL
  const videoUrl = episode ? episode.videoUrl : item.videoUrl;

  // Auto-hide controls timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying && !videoEnded) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => resetTimer();
    const handleTouchStart = () => resetTimer();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      clearTimeout(timeout);
    };
  }, [isPlaying, videoEnded]);

  // Save progress key
  const progressKey = episode 
    ? `cineNeo_progress_${item.id}_ep_${episode.id}`
    : `cineNeo_progress_${item.id}`;

  const hasRestored = useRef(false);
  const lastSavedTimeRef = useRef(0);

  // Reset restored state when media changes
  useEffect(() => {
    hasRestored.current = false;
    lastSavedTimeRef.current = 0;
  }, [videoUrl]);

  // Handle Playback triggers & Autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.log("Autoplay blocked, user interaction required:", e);
          setIsPlaying(false);
        });
    }
  }, [videoUrl]);

  // Handle countdown triggers on video end
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setVideoEnded(true);

    // Clean progress upon completion
    localStorage.removeItem(progressKey);

    if (nextEpisode && onPlayNextEpisode) {
      setNextEpCountdown(10);
    } else {
      // Find 3 recommended items from catalog
      const filtered = allCatalogItems
        .filter((i) => i.id !== item.id)
        .slice(0, 3);
      setRecommendations(filtered);
    }
  };

  // Live Next Episode Countdown
  useEffect(() => {
    if (nextEpCountdown === null) return;
    if (nextEpCountdown === 0) {
      if (nextEpisode && onPlayNextEpisode) {
        onPlayNextEpisode(nextEpisode);
      }
      setNextEpCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setNextEpCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [nextEpCountdown, nextEpisode, onPlayNextEpisode]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    setCurrentTime(current);

    // Save progress periodically (at least every 1 second)
    if (Math.abs(current - lastSavedTimeRef.current) >= 1) {
      // If completed > 97% of duration, clean progress so next time starts fresh
      if (video.duration && current > video.duration * 0.97) {
        localStorage.removeItem(progressKey);
      } else {
        localStorage.setItem(progressKey, current.toString());
      }
      lastSavedTimeRef.current = current;
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);

    // Restore saved timestamp
    if (!hasRestored.current) {
      const savedTime = localStorage.getItem(progressKey);
      if (savedTime) {
        const parsedTime = parseFloat(savedTime);
        if (parsedTime > 0 && parsedTime < video.duration - 10) {
          video.currentTime = parsedTime;
          setCurrentTime(parsedTime);
        }
      }
      hasRestored.current = true;
    }

    // Force play content on load
    video.play()
      .then(() => setIsPlaying(true))
      .catch((e) => {
        console.log("Autoplay blocked on load:", e);
        setIsPlaying(false);
      });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Number(e.target.value);
    video.currentTime = val;
    setCurrentTime(val);
  };

  const handleSkipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const handleSkipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(duration, video.currentTime + 10);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Number(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !isMuted;
    video.muted = nextMute;
    setIsMuted(nextMute);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error(err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      ref={containerRef}
      id="custom-video-player"
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
    >
      {/* Real HTML5 video tag */}
      <video
        ref={videoRef}
        src={videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'} // default sample
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onClick={togglePlay}
        playsInline
      />

      {/* OVERLAY CONTROLS CONTAINER */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/60 flex flex-col justify-between transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2.5 text-zinc-300 hover:text-white transition btn-glass px-4 py-2 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-sans font-medium">{t.playerBack}</span>
          </button>
          
          <div className="text-right">
            <h3 className="text-sm sm:text-base font-bold text-white font-sans">{item.title}</h3>
            {episode && (
              <p className="text-xs text-zinc-400 font-sans mt-0.5">S01E{episode.episodeNumber} • {episode.title}</p>
            )}
          </div>
        </div>

        {/* Center play buttons */}
        <div className="flex items-center justify-center gap-8 sm:gap-14">
          <button onClick={handleSkipBackward} className="p-3 text-zinc-400 hover:text-white transition transform hover:scale-110">
            <RotateCcw className="w-8 h-8" />
          </button>
          <button onClick={togglePlay} className="p-5 bg-gradient-to-r from-neon-cyan to-indigo-500 hover:brightness-110 text-white rounded-full transition transform hover:scale-110 shadow-lg shadow-neon-cyan/20 cursor-pointer">
            {isPlaying ? <Pause className="w-8 h-8 fill-current text-white" /> : <Play className="w-8 h-8 fill-current text-white translate-x-0.5" />}
          </button>
          <button onClick={handleSkipForward} className="p-3 text-zinc-400 hover:text-white transition transform hover:scale-110">
            <RotateCw className="w-8 h-8" />
          </button>
        </div>

        {/* Bottom Bar Controls */}
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Seek Progress slider */}
          <div className="flex items-center gap-3.5">
            <span className="text-xs font-mono text-zinc-400">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 rounded-full bg-white/10 accent-neon-cyan hover:accent-neon-cyan cursor-pointer outline-none"
            />
            <span className="text-xs font-mono text-zinc-400">{formatTime(duration)}</span>
          </div>

          {/* Controls strip */}
          <div className="flex items-center justify-between">
            {/* Volume */}
            <div className="flex items-center gap-2.5">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1 rounded-full bg-zinc-800 accent-zinc-100 cursor-pointer outline-none"
              />
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-zinc-400 hover:text-white transition">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* COUNTDOWN POPUP FOR NEXT EPISODE */}
      {nextEpCountdown !== null && nextEpisode && (
        <div className="absolute bottom-10 right-10 glass-panel p-5 rounded-3xl w-80 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex gap-4">
            <img 
              src={nextEpisode.thumbnailUrl} 
              alt={nextEpisode.title} 
              className="w-24 aspect-video rounded-xl object-cover border border-white/10 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold text-neon-cyan uppercase tracking-widest">{t.playerNextEpisodeIn} {nextEpCountdown}s</span>
              <h4 className="text-xs font-sans font-bold text-zinc-100 line-clamp-1">{nextEpisode.title}</h4>
              <p className="text-[10px] text-zinc-500 line-clamp-1">{nextEpisode.description}</p>
            </div>
          </div>
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => {
                if (onPlayNextEpisode) onPlayNextEpisode(nextEpisode);
                setNextEpCountdown(null);
              }}
              className="flex-1 bg-gradient-to-r from-neon-cyan to-indigo-500 hover:brightness-110 text-white py-2 rounded-xl text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 fill-current text-white" />
              <span>{t.playerSkip}</span>
            </button>
            <button
              onClick={() => setNextEpCountdown(null)}
              className="px-4 btn-glass text-zinc-300 rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* END-SCREEN RECOMMENDATIONS FOR Standalone film or end of season */}
      {videoEnded && nextEpCountdown === null && (
        <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="max-w-3xl w-full space-y-8">
            <div className="space-y-1">
              <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest block">FIM DE EXIBIÇÃO</span>
              <h3 className="text-xl sm:text-2xl font-sans font-bold text-zinc-100">{t.playerRecommendedEnd}</h3>
            </div>

            {/* Recs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  onClick={() => onPlayRecommended && onPlayRecommended(rec)}
                  className="group rounded-2xl glass-panel hover:border-neon-cyan overflow-hidden cursor-pointer transition transform hover:scale-105 hover:shadow-2xl hover:shadow-neon-cyan/10"
                >
                  <div className="relative aspect-video">
                    <img 
                      src={rec.posterUrl} 
                      alt={rec.title} 
                      className="w-full h-full object-cover filter brightness-[0.7] group-hover:brightness-[0.9] transition"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition">
                      <Play className="w-10 h-10 p-2.5 bg-[#050507]/80 border border-white/10 group-hover:bg-white group-hover:text-black rounded-full transition text-white" />
                    </div>
                  </div>
                  <div className="p-3 text-left">
                    <h4 className="text-xs font-sans font-bold text-zinc-200 line-clamp-1 group-hover:text-neon-cyan transition">{rec.title}</h4>
                    <div className="flex items-center gap-2.5 mt-1 text-[10px] text-zinc-500 font-mono">
                      <span>★ {rec.rating}</span>
                      <span>•</span>
                      <span>{rec.genres[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="btn-glass text-zinc-300 px-6 py-2.5 rounded-xl font-sans text-xs uppercase tracking-widest transition cursor-pointer"
            >
              Voltar ao Catálogo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
