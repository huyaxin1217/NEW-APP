import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'heavy' | 'liquid';
}

export function GlassCard({ children, className = '', variant = 'light', ...props }: GlassCardProps) {
  let baseStyles = 'rounded-3xl border shadow-xl transition-all duration-300';
  
  if (variant === 'light') {
    baseStyles += ' bg-white/40 backdrop-blur-md border-white/50 shadow-white/20';
  } else if (variant === 'heavy') {
    baseStyles += ' bg-white/70 backdrop-blur-xl border-white/80 shadow-slate-200/50';
  } else if (variant === 'liquid') {
    baseStyles += ' bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-lg border-white/60 shadow-xl shadow-blue-900/5';
  }

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}
