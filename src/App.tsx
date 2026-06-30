/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { openDatabase, seedDatabaseIfEmpty, getMediaItems } from './db/indexedDB';
import { translations } from './utils/i18n';
import { Profile, MediaItem, Notification, LanguageCode, ThemeMode, Episode } from './types';

// Import Components
import Login from './components/Login';
import Profiles from './components/Profiles';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import MovieRow from './components/MovieRow';
import MovieDetails from './components/MovieDetails';
import VideoPlayer from './components/VideoPlayer';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Global Session State
  const [lang, setLang] = useState<LanguageCode>('pt-BR');
  const [theme, setTheme] = useState<ThemeMode>('dark-neon');
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  // Catalog/Data State
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // App Routing Tab state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile-specific Watch lists State
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<string[]>([]); // tracked for AI curators

  // Notification engine State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Detailed Modal or Playing Fullscreen State
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);
  const [playingMovie, setPlayingMovie] = useState<MediaItem | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);

  const t = translations[lang];

  // 1. Initial Seeding and Catalog Loading
  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      await seedDatabaseIfEmpty();
      const items = await getMediaItems();
      setCatalog(items);
    } catch (e) {
      console.error('Error loading CineNeo database:', e);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    
    // Load session persistence if "Keep Connected" was checked
    const savedSession = localStorage.getItem('cineNeo_session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setIsAdmin(parsed.isAdmin);
      setIsSessionStarted(true);
    }

    // Load active notifications list
    const savedNotifications = localStorage.getItem('cineNeo_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    } else {
      const initialNotifs: Notification[] = [
        {
          id: '1',
          title: 'Bem-vindo ao CineNeo!',
          message: 'Explore filmes e séries com design premium e suporte de Inteligência Artificial de ponta.',
          timestamp: '10:00',
          read: false
        }
      ];
      localStorage.setItem('cineNeo_notifications', JSON.stringify(initialNotifs));
      setNotifications(initialNotifs);
    }
  }, []);

  // 2. Load Profile Preferences (Watchlist, Downloads, Theme, Lang)
  useEffect(() => {
    if (!activeProfile) return;

    // Load custom profile lists from localStorage
    const savedState = localStorage.getItem(`cineNeo_state_${activeProfile.id}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setWatchlist(parsed.watchlist || []);
      setDownloads(parsed.downloads || []);
      setWatchHistory(parsed.watchHistory || []);
    } else {
      // Clear for new profile
      setWatchlist([]);
      setDownloads([]);
      setWatchHistory([]);
    }

    // Load saved lang/theme for this profile
    const savedPrefs = localStorage.getItem(`cineNeo_prefs_${activeProfile.id}`);
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs);
      if (parsed.lang) setLang(parsed.lang);
      if (parsed.theme) setTheme(parsed.theme);
    }
  }, [activeProfile]);

  // Save current profile states when changed
  const saveProfileState = (newWatchlist: string[], newDownloads: string[], newHistory: string[]) => {
    if (!activeProfile) return;
    localStorage.setItem(
      `cineNeo_state_${activeProfile.id}`,
      JSON.stringify({ watchlist: newWatchlist, downloads: newDownloads, watchHistory: newHistory })
    );
  };

  // 3. User Actions
  const handleLoginSuccess = (adminMode: boolean, keepConnected: boolean) => {
    setIsAdmin(adminMode);
    setIsSessionStarted(true);
    if (keepConnected) {
      localStorage.setItem('cineNeo_session', JSON.stringify({ isAdmin: adminMode }));
    } else {
      sessionStorage.setItem('cineNeo_session', JSON.stringify({ isAdmin: adminMode }));
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    setActiveProfile(profile);
    setActiveTab('home');
  };

  const handleSignOutProfile = () => {
    setActiveProfile(null);
    setIsSessionStarted(false);
    setIsAdmin(false);
    localStorage.removeItem('cineNeo_session');
    sessionStorage.removeItem('cineNeo_session');
  };

  // Watchlist Toggle
  const handleToggleWatchlist = (id: string) => {
    let updated;
    if (watchlist.includes(id)) {
      updated = watchlist.filter((w) => w !== id);
    } else {
      updated = [...watchlist, id];
    }
    setWatchlist(updated);
    saveProfileState(updated, downloads, watchHistory);
  };

  // Download ("Assistir Mais Tarde" internal app downloads)
  const handleToggleDownload = (id: string) => {
    let updated;
    if (downloads.includes(id)) {
      updated = downloads.filter((d) => d !== id);
    } else {
      updated = [...downloads, id];
    }
    setDownloads(updated);
    saveProfileState(watchlist, updated, watchHistory);
  };

  // Play Video controller
  const handlePlayVideo = (mediaItem: MediaItem, ep?: Episode) => {
    setPlayingMovie(mediaItem);
    setPlayingEpisode(ep || null);
    setSelectedMovie(null); // hide details on play

    // Save to watch history titles list for AI recommendations
    if (!watchHistory.includes(mediaItem.title)) {
      const updatedHistory = [...watchHistory, mediaItem.title];
      setWatchHistory(updatedHistory);
      saveProfileState(watchlist, downloads, updatedHistory);
    }
  };

  // Play next episode in series
  const handlePlayNextEpisode = (ep: Episode) => {
    setPlayingEpisode(ep);
  };

  const clearNotifications = () => {
    localStorage.removeItem('cineNeo_notifications');
    setNotifications([]);
  };

  // Save specific language/theme changes
  const handleSetLang = (newLang: LanguageCode) => {
    setLang(newLang);
    if (activeProfile) {
      localStorage.setItem(`cineNeo_prefs_${activeProfile.id}`, JSON.stringify({ lang: newLang, theme }));
    }
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (activeProfile) {
      localStorage.setItem(`cineNeo_prefs_${activeProfile.id}`, JSON.stringify({ lang, theme: newTheme }));
    }
  };

  // 4. Filtering Catalog for Display Rows
  const getFilteredItems = () => {
    let items = [...catalog].filter((i) => !i.inTrash);
    
    // Filter for Kids Profile
    if (activeProfile?.isChild) {
      items = items.filter((i) => i.genres.includes('Comédia') || i.genres.includes('Animação') || i.genres.includes('Família') || i.genres.includes('Natureza'));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    return items;
  };

  const filteredCatalog = getFilteredItems();

  // Highlight Carousel listings
  const highlightItems = filteredCatalog.filter((i) => !i.releaseDate); // Only released titles

  // Row categorization definitions
  const top10Items = filteredCatalog
    .filter((i) => i.top10Rank !== undefined)
    .sort((a, b) => (a.top10Rank || 0) - (b.top10Rank || 0));

  const upcomingReleases = filteredCatalog.filter((i) => i.releaseDate !== undefined);

  const moviesCatalog = filteredCatalog.filter((i) => i.type === 'movie' && !i.releaseDate);
  const seriesCatalog = filteredCatalog.filter((i) => i.type === 'series' && !i.releaseDate);

  const myListCatalog = filteredCatalog.filter((i) => watchlist.includes(i.id));
  const downloadsCatalog = filteredCatalog.filter((i) => downloads.includes(i.id));

  // Find next episode if current playing is part of a series
  const getNextEpisode = () => {
    if (!playingMovie || !playingEpisode || !playingMovie.seasons) return undefined;
    
    // Sort seasons by seasonNumber to be safe
    const sortedSeasons = [...playingMovie.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
    
    for (let s = 0; s < sortedSeasons.length; s++) {
      const season = sortedSeasons[s];
      const epIndex = season.episodes.findIndex((e) => e.id === playingEpisode.id);
      if (epIndex !== -1) {
        // Found the episode in this season.
        // Check if there is a next episode in the same season.
        if (epIndex + 1 < season.episodes.length) {
          return season.episodes[epIndex + 1];
        }
        // If not, is there a next season?
        if (s + 1 < sortedSeasons.length) {
          const nextSeason = sortedSeasons[s + 1];
          // Get the first episode of the next season
          if (nextSeason.episodes.length > 0) {
            return nextSeason.episodes[0];
          }
        }
        break;
      }
    }
    return undefined;
  };

  // Theme Wrapper Classes
  const getThemeClass = () => {
    if (theme === 'dark-purple') return 'bg-zinc-950 text-fuchsia-50 selection:bg-fuchsia-500/30';
    if (theme === 'light') return 'bg-zinc-50 text-zinc-900 selection:bg-indigo-100';
    return 'bg-zinc-950 text-cyan-50 selection:bg-cyan-500/30'; // dark-neon default
  };

  // RENDER FLOWS
  if (!isSessionStarted) {
    return (
      <Login
        t={t}
        lang={lang}
        setLang={handleSetLang}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (!activeProfile) {
    return (
      <Profiles
        t={t}
        onProfileSelect={handleProfileSelect}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col mesh-bg text-zinc-100">
      
      {/* Navbar overlay */}
      <Navbar
        t={t}
        activeProfile={activeProfile}
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        lang={lang}
        setLang={handleSetLang}
        theme={theme}
        setTheme={handleSetTheme}
        notifications={notifications}
        clearNotifications={clearNotifications}
        onSignOutProfile={handleSignOutProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container Views based on Tabs */}
      <main className="flex-1 pb-16">
        {activeTab === 'admin' && isAdmin ? (
          <AdminPanel
            t={t}
            catalogItems={catalog}
            onRefreshCatalog={loadCatalog}
            onClose={() => setActiveTab('home')}
          />
        ) : (
          <div className="space-y-4">
            {/* Search or Filter Category Header */}
            {searchQuery && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <h2 className="text-xl md:text-2xl font-sans font-extrabold text-zinc-100">
                  Resultados para "{searchQuery}"
                </h2>
              </div>
            )}

            {/* Standard Tab Layouts */}
            {activeTab === 'home' && !searchQuery && (
              <>
                <HeroCarousel
                  t={t}
                  items={highlightItems}
                  onPlay={handlePlayVideo}
                  onOpenDetails={setSelectedMovie}
                />
                
                {/* Rows Collection */}
                <div className="space-y-4 sm:space-y-8 mt-[-30px] sm:mt-[-50px] relative z-10">
                  <MovieRow
                    t={t}
                    title={t.rowTop10}
                    items={top10Items}
                    onOpenDetails={setSelectedMovie}
                    onPlay={handlePlayVideo}
                    isTop10
                  />

                  <MovieRow
                    t={t}
                    title={t.rowReleases}
                    items={upcomingReleases}
                    onOpenDetails={setSelectedMovie}
                    onPlay={handlePlayVideo}
                  />

                  {myListCatalog.length > 0 && (
                    <MovieRow
                      t={t}
                      title={t.rowMyList}
                      items={myListCatalog}
                      onOpenDetails={setSelectedMovie}
                      onPlay={handlePlayVideo}
                    />
                  )}

                  <MovieRow
                    t={t}
                    title="Filmes de Sucesso"
                    items={moviesCatalog}
                    onOpenDetails={setSelectedMovie}
                    onPlay={handlePlayVideo}
                  />

                  <MovieRow
                    t={t}
                    title="Séries Espetaculares"
                    items={seriesCatalog}
                    onOpenDetails={setSelectedMovie}
                    onPlay={handlePlayVideo}
                  />
                </div>
              </>
            )}

            {/* Filtered Series Tab */}
            {activeTab === 'series' && (
              <div className="pt-8">
                <MovieRow
                  t={t}
                  title="Séries em Destaque"
                  items={seriesCatalog}
                  onOpenDetails={setSelectedMovie}
                  onPlay={handlePlayVideo}
                />
              </div>
            )}

            {/* Filtered Movies Tab */}
            {activeTab === 'movies' && (
              <div className="pt-8">
                <MovieRow
                  t={t}
                  title="Filmes em Destaque"
                  items={moviesCatalog}
                  onOpenDetails={setSelectedMovie}
                  onPlay={handlePlayVideo}
                />
              </div>
            )}

            {/* Watchlist Tab */}
            {activeTab === 'mylist' && (
              <div className="pt-8">
                <MovieRow
                  t={t}
                  title={t.rowMyList}
                  items={myListCatalog}
                  onOpenDetails={setSelectedMovie}
                  onPlay={handlePlayVideo}
                />
              </div>
            )}

            {/* Downloads Tab */}
            {activeTab === 'downloads' && (
              <div className="pt-8">
                <MovieRow
                  t={t}
                  title={t.rowDownloads}
                  items={downloadsCatalog}
                  onOpenDetails={setSelectedMovie}
                  onPlay={handlePlayVideo}
                />
              </div>
            )}

            {/* Search Active View */}
            {searchQuery && (
              <div className="pt-4">
                <MovieRow
                  t={t}
                  title="Títulos Encontrados"
                  items={filteredCatalog}
                  onOpenDetails={setSelectedMovie}
                  onPlay={handlePlayVideo}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* DETAIL DRAWER / MODAL */}
      {selectedMovie && (
        <MovieDetails
          t={t}
          item={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={handlePlayVideo}
          watchlist={watchlist}
          toggleWatchlist={handleToggleWatchlist}
          downloads={downloads}
          toggleDownload={handleToggleDownload}
          watchHistoryTitles={watchHistory}
          language={lang}
        />
      )}

      {/* CUSTOM PLAYER SCREEN OVERLAY */}
      {playingMovie && (
        <VideoPlayer
          t={t}
          item={playingMovie}
          episode={playingEpisode || undefined}
          onClose={() => {
            setPlayingMovie(null);
            setPlayingEpisode(null);
          }}
          nextEpisode={getNextEpisode()}
          onPlayNextEpisode={handlePlayNextEpisode}
          allCatalogItems={catalog}
          onPlayRecommended={(rec) => handlePlayVideo(rec)}
        />
      )}

    </div>
  );
}
