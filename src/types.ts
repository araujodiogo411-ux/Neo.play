/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string; // custom upload URL or prebuilt avatar key
  isChild: boolean;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "45m"
  thumbnailUrl: string;
  thumbnailBlobId?: string; // IndexedDB key
  videoUrl: string;
  videoBlobId?: string; // IndexedDB key
  episodeNumber: number;
  seasonNumber?: number;
}

export interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'series';
  releaseDate?: string; // e.g. "2026-07-15" (for future countdown)
  scheduledExpirationDate?: string; // e.g. "2026-08-01" (to show "Saída em breve")
  posterUrl: string; // Fallback or uploaded reference
  posterBlobId?: string; // IndexedDB poster key
  videoUrl: string; // Fallback or uploaded reference
  videoBlobId?: string; // IndexedDB trailer/movie key
  genres: string[];
  rating: string; // IMDb rating e.g. "8.9" or Age certification "A16"
  top10Rank?: number; // 1 to 10 rank or undefined
  newSeasonSoon?: boolean; // Red alert badge "Nova temporada em breve"
  seasons?: Season[]; // present if type === 'series'
  duration?: string; // e.g. "2h 15m" for movie
  isPreconfigured?: boolean;
  inTrash?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ProfileWatchState {
  profileId: string;
  watchlist: string[]; // mediaItem IDs
  downloads: string[]; // mediaItem IDs ("Assistir mais tarde" acting as internal downloads)
  watchHistory: {
    mediaId: string;
    episodeId?: string;
    progress: number; // percentage
    currentTime: number;
    updatedAt: string;
  }[];
}

export type LanguageCode = 'pt-BR' | 'pt-PT' | 'en' | 'es' | 'zh';

export type ThemeMode = 'dark-neon' | 'dark-purple' | 'light';

export interface TranslationSchema {
  loginTitle: string;
  loginSubtitle: string;
  loginPasswordPlaceholder: string;
  loginButton: string;
  keepConnected: string;
  adminLoginTitle: string;
  invalidPassword: string;
  
  profilesTitle: string;
  profilesManage: string;
  profilesSave: string;
  profilesCancel: string;
  profilesDelete: string;
  profilesAdd: string;
  profilesEdit: string;
  profilesNamePlaceholder: string;
  profilesChild: string;
  
  navHome: string;
  navSeries: string;
  navMovies: string;
  navMyList: string;
  navDownloads: string;
  navAdmin: string;
  navSearchPlaceholder: string;
  navSignOut: string;
  
  heroPlay: string;
  heroMoreInfo: string;
  
  rowTop10: string;
  rowReleases: string;
  rowMyList: string;
  rowDownloads: string;
  rowRecommendations: string;
  
  detailsRating: string;
  detailsGenres: string;
  detailsRelease: string;
  detailsDuration: string;
  detailsEpisodes: string;
  detailsSeasons: string;
  detailsSeasonCount: string;
  detailsNewSeasonSoon: string;
  detailsExitingSoon: string;
  detailsReleaseCountdown: string;
  detailsAddToMyList: string;
  detailsRemoveFromMyList: string;
  detailsDownload: string;
  detailsDownloaded: string;
  detailsSimilar: string;
  detailsAiRecommendations: string;
  detailsAiAnalyzing: string;
  detailsAiPromptPlaceholder: string;
  detailsAiAsk: string;
  detailsAiIntro: string;
  
  playerNextEpisodeIn: string;
  playerSkip: string;
  playerRecommendedEnd: string;
  playerBack: string;
  
  adminTitle: string;
  adminAddContent: string;
  adminManageContent: string;
  adminFormTitle: string;
  adminFormDesc: string;
  adminFormType: string;
  adminFormTypeMovie: string;
  adminFormTypeSeries: string;
  adminFormGenres: string;
  adminFormRating: string;
  adminFormDuration: string;
  adminFormPoster: string;
  adminFormVideo: string;
  adminFormReleaseDate: string;
  adminFormExpirationDate: string;
  adminFormTop10: string;
  adminFormNewSeasonSoon: string;
  adminFormSave: string;
  adminFormUploadLimit: string;
  adminEpTitle: string;
  adminEpDesc: string;
  adminEpDuration: string;
  adminEpThumbnail: string;
  adminEpVideo: string;
  adminEpAdd: string;
  adminEpList: string;
  adminSuccess: string;
  adminDeleteConfirm: string;
  adminClearAllNotifications: string;
  adminEditContent: string;
  adminCancelEdit: string;
  adminEditSuccess: string;
  adminTrashTab: string;
  adminTrashEmpty: string;
  adminRestore: string;
  adminDeletePermanent: string;
  adminRestoreSuccess: string;
  adminTrashSuccess: string;
  adminDeletePermanentConfirm: string;
  
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}
