/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, ListPlus, Film, Info, ArrowLeft, Upload, FileText, Calendar, CheckSquare, RotateCcw } from 'lucide-react';
import { MediaItem, Episode, Season, TranslationSchema } from '../types';
import { saveBlob, saveMediaItem, deleteMediaItem, deleteBlob } from '../db/indexedDB';

interface AdminPanelProps {
  t: TranslationSchema;
  catalogItems: MediaItem[];
  onRefreshCatalog: () => void;
  onClose: () => void;
}

export default function AdminPanel({ t, catalogItems, onRefreshCatalog, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'trash'>('add');
  
  // Media Form State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'series'>('movie');
  const [genresText, setGenresText] = useState('');
  const [rating, setRating] = useState('8.0');
  const [duration, setDuration] = useState('2h');
  const [releaseDate, setReleaseDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [top10, setTop10] = useState<number | undefined>(undefined);
  const [newSeasonSoon, setNewSeasonSoon] = useState(false);

  // File states (Stores either raw File or URL)
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Series Episodes & Seasons sub-state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedFormSeasonNumber, setSelectedFormSeasonNumber] = useState<number>(1);
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epDuration, setEpDuration] = useState('45m');
  const [epThumbnailUrl, setEpThumbnailUrl] = useState('');
  const [epThumbnailFile, setEpThumbnailFile] = useState<File | null>(null);
  const [epVideoUrl, setEpVideoUrl] = useState('');
  const [epVideoFile, setEpVideoFile] = useState<File | null>(null);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Get episodes for the currently selected form season
  const getCurrentSeasonEpisodes = () => {
    const s = seasons.find((x) => x.seasonNumber === selectedFormSeasonNumber);
    return s ? s.episodes : [];
  };

  // Handle adding an episode to the current series draft (with multi-season support)
  const handleAddEpisodeDraft = async () => {
    if (!epTitle.trim()) return;

    let thumbnailBlobId = undefined;
    let finalThumbnailUrl = epThumbnailUrl;
    if (epThumbnailFile) {
      thumbnailBlobId = `thumb_${Date.now()}`;
      await saveBlob(thumbnailBlobId, epThumbnailFile);
      finalThumbnailUrl = ''; // Resolved from IndexedDB key later
    }

    let videoBlobId = undefined;
    let finalVideoUrl = epVideoUrl;
    if (epVideoFile) {
      videoBlobId = `video_${Date.now()}`;
      await saveBlob(videoBlobId, epVideoFile);
      finalVideoUrl = ''; // Resolved from IndexedDB key later
    }

    const currentEps = getCurrentSeasonEpisodes();
    const newEp: Episode = {
      id: `ep_${Date.now()}`,
      title: epTitle.trim(),
      description: epDesc.trim(),
      duration: epDuration,
      thumbnailUrl: finalThumbnailUrl || 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      thumbnailBlobId,
      videoUrl: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      videoBlobId,
      episodeNumber: currentEps.length + 1,
      seasonNumber: selectedFormSeasonNumber
    };

    setSeasons((prevSeasons) => {
      const existingSeasonIndex = prevSeasons.findIndex(
        (s) => s.seasonNumber === selectedFormSeasonNumber
      );

      if (existingSeasonIndex !== -1) {
        const updated = [...prevSeasons];
        updated[existingSeasonIndex] = {
          ...updated[existingSeasonIndex],
          episodes: [...updated[existingSeasonIndex].episodes, newEp]
        };
        return updated;
      } else {
        return [
          ...prevSeasons,
          {
            id: `season_${Date.now()}`,
            seasonNumber: selectedFormSeasonNumber,
            title: `Temporada ${selectedFormSeasonNumber}`,
            episodes: [newEp]
          }
        ];
      }
    });

    // Clear episode inputs
    setEpTitle('');
    setEpDesc('');
    setEpDuration('45m');
    setEpThumbnailUrl('');
    setEpThumbnailFile(null);
    setEpVideoUrl('');
    setEpVideoFile(null);
  };

  const handleDeleteEpisode = (seasonNum: number, epId: string) => {
    setSeasons((prevSeasons) => {
      return prevSeasons
        .map((s) => {
          if (s.seasonNumber === seasonNum) {
            const filteredEps = s.episodes.filter((e) => e.id !== epId);
            const reindexed = filteredEps.map((e, idx) => ({
              ...e,
              episodeNumber: idx + 1
            }));
            return { ...s, episodes: reindexed };
          }
          return s;
        })
        .filter((s) => s.episodes.length > 0);
    });
  };

  // Main Form Submit to save media content
  const handleSubmitMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const mediaId = editingItemId || `media_${Date.now()}`;
      const editingItem = editingItemId ? catalogItems.find((item) => item.id === editingItemId) : null;
      
      // Save poster Blob if uploaded
      let posterBlobId = editingItem?.posterBlobId;
      let finalPosterUrl = posterUrl;
      if (posterFile) {
        if (editingItem?.posterBlobId) {
          try { await deleteBlob(editingItem.posterBlobId); } catch (e) { console.error(e); }
        }
        posterBlobId = `poster_${Date.now()}`;
        await saveBlob(posterBlobId, posterFile);
        finalPosterUrl = '';
      } else if (editingItem?.posterBlobId && posterUrl && posterUrl !== editingItem.posterUrl) {
        // User changed URL manually, discard old blob
        try { await deleteBlob(editingItem.posterBlobId); } catch (e) { console.error(e); }
        posterBlobId = undefined;
      }

      // Save trailer/movie video Blob if uploaded
      let videoBlobId = editingItem?.videoBlobId;
      let finalVideoUrl = videoUrl;
      if (videoFile) {
        if (editingItem?.videoBlobId) {
          try { await deleteBlob(editingItem.videoBlobId); } catch (e) { console.error(e); }
        }
        videoBlobId = `video_${Date.now()}`;
        await saveBlob(videoBlobId, videoFile);
        finalVideoUrl = '';
      } else if (editingItem?.videoBlobId && videoUrl && videoUrl !== editingItem.videoUrl) {
        // User changed URL manually, discard old blob
        try { await deleteBlob(editingItem.videoBlobId); } catch (e) { console.error(e); }
        videoBlobId = undefined;
      }

      // Parse genres
      const genres = genresText
        .split(',')
        .map((g) => g.trim())
        .filter((g) => g.length > 0);

      // Construct Season list if Series type
      let finalSeasons: Season[] | undefined = undefined;
      if (mediaType === 'series') {
        finalSeasons = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
      }

      const newMedia: MediaItem = {
        id: mediaId,
        title: title.trim(),
        description: description.trim(),
        type: mediaType,
        genres: genres.length > 0 ? genres : ['Geral'],
        rating: rating || '8.0',
        duration: mediaType === 'movie' ? duration : undefined,
        releaseDate: releaseDate || undefined,
        scheduledExpirationDate: expirationDate || undefined,
        top10Rank: top10,
        newSeasonSoon: mediaType === 'series' ? newSeasonSoon : undefined,
        posterUrl: finalPosterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        posterBlobId,
        videoUrl: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoBlobId,
        seasons: finalSeasons,
      };

      await saveMediaItem(newMedia);
      
      // Create global notification alert only for new items
      if (!editingItemId) {
        const savedNotifs = localStorage.getItem('cineNeo_notifications') || '[]';
        const notifications = JSON.parse(savedNotifs);
        notifications.unshift({
          id: `notif_${Date.now()}`,
          title: `Novo Lançamento: ${title.trim()}`,
          message: `${mediaType === 'movie' ? 'O filme' : 'A série'} "${title.trim()}" já está disponível na plataforma!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        });
        localStorage.setItem('cineNeo_notifications', JSON.stringify(notifications));
      }

      const wasEditing = !!editingItemId;

      // Reset main fields
      setEditingItemId(null);
      setTitle('');
      setDescription('');
      setGenresText('');
      setRating('8.0');
      setDuration('2h');
      setReleaseDate('');
      setExpirationDate('');
      setTop10(undefined);
      setNewSeasonSoon(false);
      setPosterUrl('');
      setPosterFile(null);
      setVideoUrl('');
      setVideoFile(null);
      setSeasons([]);
      setSelectedFormSeasonNumber(1);

      setMessage(wasEditing ? t.adminEditSuccess : t.adminSuccess);
      onRefreshCatalog();
    } catch (err) {
      console.error(err);
      setMessage('Erro ao gravar conteúdo. Verifique o espaço livre.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: MediaItem) => {
    setEditingItemId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setMediaType(item.type);
    setGenresText(item.genres.join(', '));
    setRating(item.rating || '8.0');
    setDuration(item.duration || '2h');
    setReleaseDate(item.releaseDate || '');
    setExpirationDate(item.scheduledExpirationDate || '');
    setTop10(item.top10Rank);
    setNewSeasonSoon(!!item.newSeasonSoon);
    setPosterUrl(item.posterUrl || '');
    setPosterFile(null);
    setVideoUrl(item.videoUrl || '');
    setVideoFile(null);
    setSeasons(item.seasons || []);
    setSelectedFormSeasonNumber(item.seasons?.[0]?.seasonNumber || 1);
    setActiveTab('add');
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setTitle('');
    setDescription('');
    setGenresText('');
    setRating('8.0');
    setDuration('2h');
    setReleaseDate('');
    setExpirationDate('');
    setTop10(undefined);
    setNewSeasonSoon(false);
    setPosterUrl('');
    setPosterFile(null);
    setVideoUrl('');
    setVideoFile(null);
    setSeasons([]);
    setSelectedFormSeasonNumber(1);
    setMessage('');
  };

  const handleMoveToTrash = async (item: MediaItem) => {
    if (editingItemId === item.id) {
      handleCancelEdit();
    }
    const updatedItem = { ...item, inTrash: true };
    await saveMediaItem(updatedItem);
    setMessage(t.adminTrashSuccess);
    onRefreshCatalog();
  };

  const handleRestoreItem = async (item: MediaItem) => {
    const updatedItem = { ...item, inTrash: false };
    await saveMediaItem(updatedItem);
    setMessage(t.adminRestoreSuccess);
    onRefreshCatalog();
  };

  const handleDeletePermanent = async (item: MediaItem) => {
    if (confirm(t.adminDeletePermanentConfirm)) {
      if (editingItemId === item.id) {
        handleCancelEdit();
      }
      await deleteMediaItem(item.id);
      setMessage(t.adminDeleteConfirm);
      onRefreshCatalog();
    }
  };

  return (
    <div id="admin-panel-screen" className="min-h-screen mesh-bg text-zinc-100 p-4 sm:p-6 lg:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Dashboard bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-zinc-400 hover:text-neon-cyan text-xs font-sans font-medium uppercase tracking-widest transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Catálogo
            </button>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">{t.adminTitle}</h2>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition cursor-pointer ${
                activeTab === 'add' ? 'bg-gradient-to-r from-neon-cyan to-indigo-500 text-white shadow-md shadow-neon-cyan/20' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {editingItemId ? t.adminEditContent : t.adminAddContent}
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition cursor-pointer ${
                activeTab === 'manage' ? 'bg-gradient-to-r from-neon-cyan to-indigo-500 text-white shadow-md shadow-neon-cyan/20' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.adminManageContent}
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition cursor-pointer ${
                activeTab === 'trash' ? 'bg-gradient-to-r from-neon-cyan to-indigo-500 text-white shadow-md shadow-neon-cyan/20' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.adminTrashTab}
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="bg-emerald-950/40 border border-emerald-900/80 text-emerald-300 rounded-2xl p-4 text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <p className="font-sans">{message}</p>
          </div>
        )}

        {/* TAB 1: ADD CONTENT FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmitMedia} className="space-y-8">
            {editingItemId && (
              <div className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4" />
                  <p className="font-sans font-semibold">
                    Você está editando o título <span className="underline">{title}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs rounded-lg transition font-sans font-semibold cursor-pointer"
                >
                  {t.adminCancelEdit}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Core properties */}
              <div className="space-y-6 glass-panel rounded-3xl p-6 sm:p-8">
                <h3 className="text-base font-mono font-bold text-neon-cyan uppercase tracking-wider mb-2">Metadados Básicos</h3>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormTitle}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Interestelar"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-neon-cyan font-sans"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormDesc}</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do filme ou sinopse da série..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-neon-cyan font-sans"
                  />
                </div>

                {/* Media Type row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormType}</label>
                    <select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value as 'movie' | 'series')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="movie" className="bg-[#050507] text-zinc-200">{t.adminFormTypeMovie}</option>
                      <option value="series" className="bg-[#050507] text-zinc-200">{t.adminFormTypeSeries}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormRating}</label>
                    <input
                      type="text"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="Ex: 8.7 ou A14"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-neon-cyan font-sans"
                    />
                  </div>
                </div>

                {/* Genres & Optional Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormGenres}</label>
                    <input
                      type="text"
                      value={genresText}
                      onChange={(e) => setGenresText(e.target.value)}
                      placeholder="Ex: Ação, Sci-Fi"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-neon-cyan font-sans"
                    />
                  </div>

                  {mediaType === 'movie' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormDuration}</label>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Ex: 2h 15m"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-neon-cyan font-sans"
                      />
                    </div>
                  )}
                </div>

                {/* Schedulers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormReleaseDate}</label>
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormExpirationDate}</label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none"
                    />
                  </div>
                </div>

                {/* Rank & New Season checklist options */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans text-zinc-400 font-semibold">{t.adminFormTop10}</label>
                    <select
                      value={top10 || ''}
                      onChange={(e) => setTop10(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="" className="bg-[#050507]">Nenhum</option>
                      {[1,2,3,4,5,6,7,8,9,10].map((r) => (
                        <option key={r} value={r} className="bg-[#050507]">Rank {r}</option>
                      ))}
                    </select>
                  </div>

                  {mediaType === 'series' && (
                    <div className="flex items-center gap-2 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 font-sans font-semibold">
                        <input
                          type="checkbox"
                          checked={newSeasonSoon}
                          onChange={(e) => setNewSeasonSoon(e.target.checked)}
                          className="rounded text-neon-cyan bg-[#050507] border-white/10"
                        />
                        <span>{t.adminFormNewSeasonSoon}</span>
                      </label>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Poster / Video uploading + Episodes manager */}
              <div className="space-y-6">
                
                {/* Media Files Upload Block */}
                <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
                  <h3 className="text-base font-mono font-bold text-neon-cyan uppercase tracking-wider">Carga de Arquivos</h3>
                  <p className="text-[10px] font-sans text-zinc-500 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                    {t.adminFormUploadLimit}
                  </p>

                  {/* Poster upload / URL */}
                  <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-xs font-sans font-bold text-zinc-300 block">{t.adminFormPoster}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-zinc-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-white/10 file:text-[10px] file:font-sans file:font-semibold file:bg-[#050507] file:text-zinc-300 file:hover:bg-white/10 cursor-pointer"
                    />
                    {!posterFile && (
                      <input
                        type="url"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        placeholder="Ou digite o link/URL da imagem..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-neon-cyan"
                      />
                    )}
                  </div>

                  {/* Video upload / URL */}
                  <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-xs font-sans font-bold text-zinc-300 block">{t.adminFormVideo}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-zinc-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-white/10 file:text-[10px] file:font-sans file:font-semibold file:bg-[#050507] file:text-zinc-300 file:hover:bg-white/10 cursor-pointer"
                    />
                    {!videoFile && (
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Ou digite o link/URL de vídeo..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-neon-cyan"
                      />
                    )}
                  </div>
                </div>

                {/* SERIES EPISODES SUB-SECTION (CONDITIONAL) */}
                {mediaType === 'series' && (
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-mono font-bold text-neon-cyan uppercase tracking-wider">Episódios & Temporadas</h3>
                      <span className="bg-white/5 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400">
                        {seasons.reduce((acc, s) => acc + s.episodes.length, 0)} Eps • {seasons.length} Temp
                      </span>
                    </div>

                    {/* Season Selection */}
                    <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <label className="text-xs font-sans font-bold text-zinc-300 block">Temporada Ativa no Formulário</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedFormSeasonNumber}
                          onChange={(e) => setSelectedFormSeasonNumber(Number(e.target.value))}
                          className="bg-[#050507] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-neon-cyan flex-1 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num} className="bg-[#050507]">
                              Temporada {num}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const maxSeason = seasons.reduce((max, s) => s.seasonNumber > max ? s.seasonNumber : max, 0);
                            setSelectedFormSeasonNumber(maxSeason + 1);
                          }}
                          className="px-3 py-2 bg-neon-cyan/10 border border-neon-cyan/20 hover:bg-neon-cyan/25 text-neon-cyan rounded-xl text-xs font-sans font-bold transition cursor-pointer shrink-0"
                        >
                          Nova Temporada
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={epTitle}
                          onChange={(e) => setEpTitle(e.target.value)}
                          placeholder="Título do Ep"
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-neon-cyan"
                        />
                        <input
                          type="text"
                          value={epDuration}
                          onChange={(e) => setEpDuration(e.target.value)}
                          placeholder="Duração (ex: 45m)"
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-neon-cyan"
                        />
                      </div>
                      
                      <textarea
                        value={epDesc}
                        onChange={(e) => setEpDesc(e.target.value)}
                        placeholder="Sinopse do episódio..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-neon-cyan"
                      />

                      {/* Ep Thumbnail upload */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase font-mono">Miniatura</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEpThumbnailFile(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-zinc-500 file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-white/10 file:text-[10px] file:bg-[#050507] file:text-zinc-300 cursor-pointer"
                        />
                        {!epThumbnailFile && (
                          <input
                            type="url"
                            value={epThumbnailUrl}
                            onChange={(e) => setEpThumbnailUrl(e.target.value)}
                            placeholder="Link da imagem..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-neon-cyan"
                          />
                        )}
                      </div>

                      {/* Ep Video upload */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase font-mono">Vídeo do Episódio</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setEpVideoFile(e.target.files?.[0] || null)}
                          className="block w-full text-xs text-zinc-500 file:mr-4 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-white/10 file:text-[10px] file:bg-[#050507] file:text-zinc-300 cursor-pointer"
                        />
                        {!epVideoFile && (
                          <input
                            type="url"
                            value={epVideoUrl}
                            onChange={(e) => setEpVideoUrl(e.target.value)}
                            placeholder="Link de vídeo..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-neon-cyan"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddEpisodeDraft}
                        className="w-full btn-glass text-zinc-200 text-xs font-sans font-medium py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar à Temporada {selectedFormSeasonNumber}
                      </button>
                    </div>

                    {/* Added seasons and episodes list */}
                    {seasons.length > 0 && (
                      <div className="space-y-4 border-t border-white/10 pt-4">
                        <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block">Lista de Temporadas & Episódios</span>
                        <div className="max-h-60 overflow-y-auto space-y-4">
                          {[...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber).map((s) => (
                            <div key={s.seasonNumber} className="space-y-2">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span className="text-xs font-sans font-bold text-neon-cyan">Temporada {s.seasonNumber}</span>
                                <span className="text-[10px] font-mono text-zinc-500">{s.episodes.length} episódios</span>
                              </div>
                              <div className="space-y-1.5 pl-2">
                                {s.episodes.map((ep) => (
                                  <div key={ep.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-xs font-semibold font-sans text-zinc-300">S{s.seasonNumber}Ep{ep.episodeNumber}. {ep.title}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteEpisode(s.seasonNumber, ep.id)}
                                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-4 gap-3">
              {editingItemId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-sans font-bold text-sm px-8 py-3.5 rounded-xl transition cursor-pointer"
                >
                  {t.adminCancelEdit}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-neon-cyan to-indigo-500 hover:brightness-110 text-white font-sans font-bold text-sm px-10 py-3.5 rounded-xl shadow-lg shadow-neon-cyan/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processando...' : (editingItemId ? t.adminEditContent : t.adminFormSave)}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MANAGE INVENTORY GRID LIST */}
        {activeTab === 'manage' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <h3 className="text-base font-mono font-bold text-neon-cyan uppercase tracking-wider mb-6">Títulos do Acervo</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 font-mono uppercase tracking-widest">
                    <th className="pb-3 font-semibold">Capa</th>
                    <th className="pb-3 font-semibold">Título</th>
                    <th className="pb-3 font-semibold">Tipo</th>
                    <th className="pb-3 font-semibold">Gêneros</th>
                    <th className="pb-3 font-semibold">Nota</th>
                    <th className="pb-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-zinc-300">
                  {catalogItems.filter((item) => !item.inTrash).map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="py-3">
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-9 aspect-[2/3] rounded object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="py-3 font-bold text-zinc-100">{item.title}</td>
                      <td className="py-3">
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-mono text-zinc-300">
                          {item.type === 'movie' ? 'Filme' : 'Série'}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400">{item.genres.join(', ')}</td>
                      <td className="py-3 font-mono font-bold text-neon-cyan">★ {item.rating}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 bg-white/5 border border-white/10 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/30 rounded-lg transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveToTrash(item)}
                            className="p-1.5 bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:text-rose-300 hover:bg-rose-950/45 rounded-lg transition cursor-pointer"
                            title="Mover para a Lixeira"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRASH BIN LIST */}
        {activeTab === 'trash' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <h3 className="text-base font-mono font-bold text-neon-cyan uppercase tracking-wider mb-6">
              {t.adminTrashTab}
            </h3>

            {catalogItems.filter((item) => item.inTrash).length === 0 ? (
              <div className="text-center py-12 text-zinc-500 font-sans">
                <Trash2 className="w-12 h-12 mx-auto text-zinc-600 mb-3 opacity-40" />
                <p>{t.adminTrashEmpty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 font-mono uppercase tracking-widest">
                      <th className="pb-3 font-semibold">Capa</th>
                      <th className="pb-3 font-semibold">Título</th>
                      <th className="pb-3 font-semibold">Tipo</th>
                      <th className="pb-3 font-semibold">Gêneros</th>
                      <th className="pb-3 font-semibold">Nota</th>
                      <th className="pb-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-zinc-300">
                    {catalogItems.filter((item) => item.inTrash).map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="py-3">
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-9 aspect-[2/3] rounded object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="py-3 font-bold text-zinc-100">{item.title}</td>
                        <td className="py-3">
                          <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-mono text-zinc-300">
                            {item.type === 'movie' ? 'Filme' : 'Série'}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400">{item.genres.join(', ')}</td>
                        <td className="py-3 font-mono font-bold text-neon-cyan">★ {item.rating}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestoreItem(item)}
                              className="p-1.5 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/45 rounded-lg transition cursor-pointer"
                              title={t.adminRestore}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePermanent(item)}
                              className="p-1.5 bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:text-rose-300 hover:bg-rose-950/45 rounded-lg transition cursor-pointer"
                              title={t.adminDeletePermanent}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
