/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { Profile, TranslationSchema } from '../types';

interface ProfilesProps {
  t: TranslationSchema;
  onProfileSelect: (profile: Profile) => void;
}

const PREBUILT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
];

export default function Profiles({ t, onProfileSelect }: ProfilesProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // State for form
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PREBUILT_AVATARS[0]);
  const [isChild, setIsChild] = useState(false);

  useEffect(() => {
    // Load profiles from localStorage
    const saved = localStorage.getItem('cineNeo_profiles');
    if (saved) {
      setProfiles(JSON.parse(saved));
    } else {
      // Default initial profiles
      const defaultProfiles: Profile[] = [
        { id: '1', name: 'Premium User', avatarUrl: PREBUILT_AVATARS[0], isChild: false },
        { id: '2', name: 'CineKids', avatarUrl: PREBUILT_AVATARS[5], isChild: true }
      ];
      localStorage.setItem('cineNeo_profiles', JSON.stringify(defaultProfiles));
      setProfiles(defaultProfiles);
    }
  }, []);

  const saveToLocalStorage = (updated: Profile[]) => {
    localStorage.setItem('cineNeo_profiles', JSON.stringify(updated));
    setProfiles(updated);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      name: name.trim(),
      avatarUrl,
      isChild
    };

    const updated = [...profiles, newProfile];
    saveToLocalStorage(updated);
    
    // Reset form
    setName('');
    setAvatarUrl(PREBUILT_AVATARS[0]);
    setIsChild(false);
    setIsCreating(false);
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !name.trim()) return;

    const updated = profiles.map((p) => 
      p.id === editingProfile.id 
        ? { ...p, name: name.trim(), avatarUrl, isChild } 
        : p
    );
    saveToLocalStorage(updated);
    
    // Reset
    setEditingProfile(null);
    setName('');
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    saveToLocalStorage(updated);
    setEditingProfile(null);
  };

  const openEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setAvatarUrl(profile.avatarUrl);
    setIsChild(profile.isChild);
    setIsCreating(false);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingProfile(null);
    setName('');
    setAvatarUrl(PREBUILT_AVATARS[0]);
    setIsChild(false);
  };

  return (
    <div id="profiles-screen" className="min-h-screen flex items-center justify-center mesh-bg text-white p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] rounded-full bg-neon-purple/10 blur-[160px] pointer-events-none" />

      {(!editingProfile && !isCreating) ? (
        <div className="max-w-4xl w-full flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-5xl font-sans font-bold mb-12 tracking-tight">
            <span className="logo-gradient">{isManaging ? t.profilesManage : t.profilesTitle}</span>
          </h2>

          {/* Profiles Grid */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-10 mb-14">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => !isManaging && onProfileSelect(profile)}
                className="group flex flex-col items-center cursor-pointer select-none"
              >
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-neon-cyan transition-all duration-300 shadow-lg group-hover:shadow-neon-cyan/20 group-hover:scale-105">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Managed Profile overlay */}
                  {isManaging && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(profile);
                      }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center hover:bg-black/70 transition duration-150"
                    >
                      <Edit2 className="w-8 h-8 text-white p-1.5 bg-zinc-900 border border-zinc-700 rounded-full" />
                    </div>
                  )}
                </div>
                <span className="mt-4 text-zinc-400 group-hover:text-zinc-100 text-sm md:text-base font-medium font-sans">
                  {profile.name}
                </span>
                {profile.isChild && (
                  <span className="mt-1 bg-neon-purple/30 border border-neon-purple/50 text-[10px] font-mono px-2 py-0.5 rounded-full text-zinc-200 uppercase tracking-widest scale-90">
                    Kids
                  </span>
                )}
              </div>
            ))}

            {/* Add profile slot */}
            {profiles.length < 4 && (
              <div
                onClick={openCreate}
                className="group flex flex-col items-center cursor-pointer select-none"
              >
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-white/30 flex items-center justify-center transition duration-200 group-hover:scale-105 bg-white/5">
                  <Plus className="w-10 h-10 text-zinc-500 group-hover:text-zinc-300 transition duration-150" />
                </div>
                <span className="mt-4 text-zinc-500 group-hover:text-zinc-300 text-sm md:text-base font-sans">
                  {t.profilesAdd}
                </span>
              </div>
            )}
          </div>

          {/* Manage Button */}
          <button
            onClick={() => setIsManaging(!isManaging)}
            className="btn-glass px-6 py-2.5 rounded-xl font-sans text-xs md:text-sm uppercase tracking-widest transition duration-150 active:scale-95 cursor-pointer"
          >
            {isManaging ? t.profilesSave : t.profilesManage}
          </button>
        </div>
      ) : (
        /* Create or Edit Form screen */
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 relative shadow-2xl">
          <button
            onClick={() => {
              setIsCreating(false);
              setEditingProfile(null);
            }}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-zinc-500 hover:text-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl md:text-2xl font-sans font-bold mb-6 flex items-center gap-2">
            {isCreating ? t.profilesAdd : t.profilesEdit}
          </h3>

          <form onSubmit={isCreating ? handleCreateProfile : handleEditProfile} className="space-y-6">
            {/* Avatar picker list */}
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-500 uppercase tracking-widest mb-3">
                Selecione o Avatar
              </label>
              <div className="flex flex-wrap gap-3.5 justify-center bg-white/5 p-4 rounded-2xl border border-white/10">
                {PREBUILT_AVATARS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setAvatarUrl(av)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition ${
                      avatarUrl === av ? 'border-neon-cyan scale-110 shadow-lg shadow-neon-cyan/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="avatar option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {avatarUrl === av && (
                      <div className="absolute inset-0 bg-neon-cyan/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Name */}
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-500 uppercase tracking-widest mb-2">
                {t.profilesNamePlaceholder}
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Diogo"
                className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 outline-none transition font-sans"
              />
            </div>

            {/* Child Profile Switch */}
            <div className="flex items-center justify-between bg-white/5 p-4 border border-white/10 rounded-2xl">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-sans text-zinc-300 font-medium">{t.profilesChild}</span>
                <span className="text-[10px] font-sans text-zinc-500">Limita conteúdo recomendado para menores</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChild}
                  onChange={(e) => setIsChild(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-purple"></div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple hover:brightness-110 text-white font-sans font-medium text-sm py-3 rounded-xl transition duration-150 shadow-md shadow-neon-cyan/10 active:scale-[0.98]"
              >
                {t.profilesSave}
              </button>
              
              {!isCreating && (
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(editingProfile!.id)}
                  className="px-4 bg-white/5 border border-white/10 hover:bg-rose-950/30 hover:border-rose-900/80 hover:text-rose-300 text-zinc-400 rounded-xl transition duration-150"
                  title={t.profilesDelete}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProfile(null);
                }}
                className="px-5 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 rounded-xl text-sm transition font-sans"
              >
                {t.profilesCancel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
