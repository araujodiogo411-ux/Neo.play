/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Film, Search, Bell, Sun, Moon, Palette, Languages, LogOut, ShieldAlert, CheckCheck, Trash2 } from 'lucide-react';
import { Profile, LanguageCode, TranslationSchema, ThemeMode, Notification } from '../types';

interface NavbarProps {
  t: TranslationSchema;
  activeProfile: Profile;
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  notifications: Notification[];
  clearNotifications: () => void;
  onSignOutProfile: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({
  t,
  activeProfile,
  isAdmin,
  searchQuery,
  setSearchQuery,
  lang,
  setLang,
  theme,
  setTheme,
  notifications,
  clearNotifications,
  onSignOutProfile,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'pt-BR', label: 'Português (BR)' },
    { code: 'pt-PT', label: 'Português (PT)' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: '中文' },
  ];

  const themes: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'dark-neon', label: 'Neon Dark', icon: <Palette className="w-3.5 h-3.5 text-cyan-400" /> },
    { mode: 'dark-purple', label: 'Cosmic Purple', icon: <Palette className="w-3.5 h-3.5 text-fuchsia-400" /> },
    { mode: 'light', label: 'Light Clean', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> }
  ];

  return (
    <nav 
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-black/40 backdrop-blur-[15px] border-b border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Left Logo and Main Nav */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-neon-cyan via-indigo-600 to-neon-purple flex items-center justify-center shadow-lg shadow-neon-cyan/15">
                <Film className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-sans font-extrabold tracking-tight">
                <span className="logo-gradient">CINENEO</span>
              </h1>
            </div>

            {/* Main Navigation Links */}
            <div className="hidden md:flex items-center gap-5 text-sm font-medium">
              <button
                onClick={() => { setActiveTab('home'); setSearchQuery(''); }}
                className={`font-sans transition ${
                  activeTab === 'home' && !searchQuery ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.navHome}
              </button>
              <button
                onClick={() => { setActiveTab('series'); setSearchQuery(''); }}
                className={`font-sans transition ${
                  activeTab === 'series' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.navSeries}
              </button>
              <button
                onClick={() => { setActiveTab('movies'); setSearchQuery(''); }}
                className={`font-sans transition ${
                  activeTab === 'movies' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.navMovies}
              </button>
              <button
                onClick={() => { setActiveTab('mylist'); setSearchQuery(''); }}
                className={`font-sans transition ${
                  activeTab === 'mylist' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.navMyList}
              </button>
              <button
                onClick={() => { setActiveTab('downloads'); setSearchQuery(''); }}
                className={`font-sans transition ${
                  activeTab === 'downloads' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.navDownloads}
              </button>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            
            {/* Search Input */}
            <div className="relative max-w-[150px] sm:max-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.navSearchPlaceholder}
                className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition font-sans"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition relative cursor-pointer"
                id="bell-icon"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-neon-purple text-white font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div 
                  id="notifications-dropdown"
                  className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl shadow-2xl p-4 overflow-hidden z-50 animate-in fade-in slide-in-from-top-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Notificações</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          clearNotifications();
                          setShowNotifications(false);
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-sans font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        {t.adminClearAllNotifications}
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 py-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-zinc-600 text-xs font-sans">
                        Nenhuma notificação por enquanto.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                          <h4 className="text-xs font-bold text-zinc-200">{n.title}</h4>
                          <p className="text-[10.5px] text-zinc-400 mt-1 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-zinc-500 font-mono mt-2 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1 hover:bg-white/10 rounded-xl transition cursor-pointer"
                id="profile-dropdown-trigger"
              >
                <img
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.name}
                  className="w-8 h-8 rounded-lg object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <span className="hidden sm:inline text-xs font-medium text-zinc-300 font-sans">
                  {activeProfile.name}
                </span>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div 
                  id="profile-dropdown-menu"
                  className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-3"
                >
                  {/* Language Switch Section */}
                  <div className="px-2 py-1.5 border-b border-white/10 mb-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Idioma</span>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-zinc-300">
                      <Languages className="w-3.5 h-3.5 text-zinc-400" />
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value as LanguageCode)}
                        className="bg-transparent text-xs outline-none cursor-pointer w-full font-sans"
                      >
                        {languages.map((l) => (
                          <option key={l.code} value={l.code} className="bg-zinc-950 text-zinc-200">
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Themes List Selector */}
                  <div className="px-2 py-1.5 border-b border-white/10 mb-2">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Aparência</span>
                    <div className="space-y-1">
                      {themes.map((th) => (
                        <button
                          key={th.mode}
                          onClick={() => setTheme(th.mode)}
                          className={`w-full flex items-center justify-between text-left text-xs px-2 py-1 rounded-md transition cursor-pointer ${
                            theme === th.mode ? 'bg-white/10 text-white font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-sans">
                            {th.icon}
                            <span>{th.label}</span>
                          </div>
                          {theme === th.mode && <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Tab (If authorized) */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setShowProfileMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-2 rounded-xl mb-1 transition cursor-pointer ${
                        activeTab === 'admin' ? 'bg-neon-purple/20 text-zinc-200 font-semibold border border-neon-purple/30' : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-neon-cyan" />
                      <span className="font-sans">{t.navAdmin}</span>
                    </button>
                  )}

                  {/* Sign Out Profile */}
                  <button
                    onClick={() => {
                      onSignOutProfile();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 text-left text-xs px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition mt-2 font-sans cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.navSignOut}</span>
                  </button>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
