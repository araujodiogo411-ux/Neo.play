/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Film, Check, AlertTriangle, Languages } from 'lucide-react';
import { LanguageCode, TranslationSchema } from '../types';

interface LoginProps {
  t: TranslationSchema;
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  onLoginSuccess: (isAdmin: boolean, keepConnected: boolean) => void;
}

export default function Login({ t, lang, setLang, onLoginSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [keepConnected, setKeepConnected] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === 'NEO') {
      // Admin Access
      onLoginSuccess(true, keepConnected);
    } else if (password.trim() !== '') {
      // Normal User Access
      onLoginSuccess(false, keepConnected);
    } else {
      setError(t.invalidPassword);
    }
  };

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'pt-BR', label: 'Português (BR)' },
    { code: 'pt-PT', label: 'Português (PT)' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: '中文' },
  ];

  return (
    <div id="login-screen" className="relative min-h-screen flex flex-col items-center justify-center mesh-bg overflow-hidden p-4">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-purple/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-cyan/10 blur-[120px] pointer-events-none" />

      {/* Language Selector Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-2 glass-panel rounded-full px-3 py-1.5 z-10">
        <Languages className="w-4 h-4 text-zinc-400" />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as LanguageCode)}
          className="bg-transparent text-sm text-zinc-200 outline-none cursor-pointer font-sans"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code} className="bg-zinc-900 text-zinc-100">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 md:p-10 shadow-2xl relative">
        {/* Glow border ornament */}
        <div className="absolute inset-0 border border-neon-cyan/20 rounded-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-neon-cyan via-indigo-600 to-neon-purple rounded-2xl flex items-center justify-center shadow-lg shadow-neon-cyan/10 mb-4 animate-pulse">
            <Film className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-sans font-extrabold tracking-tight mb-1">
            <span className="logo-gradient">CINENEO</span>
          </h1>
          <p className="text-xs font-sans text-zinc-400 mt-1 max-w-[280px]">
            {t.loginSubtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {t.loginPasswordPlaceholder}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan/80 focus:ring-1 focus:ring-neon-cyan/30 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 outline-none transition duration-200 font-sans shadow-inner"
              />
              <div className="absolute right-3.5 top-3.5 text-zinc-600">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-900/60 text-rose-300 rounded-xl p-3.5 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Keep Connected Checkbox */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group text-sm text-zinc-400 hover:text-zinc-300">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={keepConnected}
                  onChange={(e) => setKeepConnected(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border transition duration-200 flex items-center justify-center ${
                  keepConnected ? 'bg-neon-purple border-neon-purple' : 'border-zinc-700 bg-zinc-900/50'
                }`}>
                  {keepConnected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </div>
              </div>
              <span className="font-sans text-xs">{t.keepConnected}</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:brightness-110 text-white font-sans font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-neon-cyan/20 active:scale-[0.98] transition duration-150 cursor-pointer"
          >
            {t.loginButton}
          </button>
        </form>

        {/* Footer info tip */}
        <div className="mt-8 text-center border-t border-zinc-900 pt-5">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">
            SYSTEM ENGINE SECURE BY WEB INDEXEDDB &amp; GEMINI AI
          </p>
        </div>
      </div>
    </div>
  );
}
