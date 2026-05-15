import React from 'react';
import { TrendingUp } from 'lucide-react';

interface LogoProps {
  size?: 'normal' | 'large';
  light?: boolean;
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'normal', light = false, collapsed = false }) => (
  <div className="flex items-center gap-3 transition-all duration-300">
    <div className={`w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 shrink-0 transition-transform ${collapsed ? 'scale-110' : ''}`}>
      <TrendingUp className="text-white w-6 h-6" />
    </div>
    {!collapsed && (
      <div className="flex flex-col leading-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
        <span className={`${size === 'large' ? 'text-3xl' : 'text-lg'} font-black tracking-tighter ${light ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>CRISTOFOLINI</span>
        <span className={`${size === 'large' ? 'text-xs mt-0.5' : 'text-[9px]'} font-bold tracking-[0.2em] ${light ? 'text-indigo-200' : 'text-zinc-500 dark:text-zinc-400'} uppercase`}>Representações</span>
      </div>
    )}
  </div>
);