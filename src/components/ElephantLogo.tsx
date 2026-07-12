import React from 'react';

/**
 * Elephant logo with multiple "mood" personalities.
 *
 * Moods cycle based on the user's streak and recent completion velocity:
 *  - sleepy    : no recent activity
 *  - focused   : mid-task, no streak
 *  - happy     : light activity
 *  - proud     : 3+ day streak
 *  - celebrating : just completed a task (passed via prop)
 *  - zen       : in zen mode
 *
 * Each mood reuses the same base SVG geometry but tints accents, swaps eye
 * shape, and adjusts mouth curvature so the elephant's vibe reads at a glance.
 */
export type ElephantMood =
  | 'sleepy'
  | 'focused'
  | 'happy'
  | 'proud'
  | 'celebrating'
  | 'zen';

export interface ElephantLogoProps {
  size?: number;
  className?: string;
  mood?: ElephantMood;
  /** Animation hint; defaults vary by mood. */
  animate?: boolean;
}

interface MoodStyle {
  bodyFill: string;
  eyeFill: string;
  eyeVariant: 'dot' | 'closed' | 'sparkle' | 'wide';
  mouthCurve: number; // px offset
  extra: React.ReactNode;
}

const MOOD_STYLES: Record<ElephantMood, MoodStyle> = {
  sleepy: {
    bodyFill: 'fill-slate-500/85',
    eyeFill: 'fill-slate-700',
    eyeVariant: 'closed',
    mouthCurve: -1,
    extra: (
      <text x="32" y="8" fontSize="5" fill="currentColor" opacity="0.5">z</text>
    ),
  },
  focused: {
    bodyFill: 'fill-blue-500/85',
    eyeFill: 'fill-blue-900',
    eyeVariant: 'dot',
    mouthCurve: 0,
    extra: (
      <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
    ),
  },
  happy: {
    bodyFill: 'fill-emerald-500/85',
    eyeFill: 'fill-emerald-900',
    eyeVariant: 'sparkle',
    mouthCurve: 2,
    extra: (
      <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.4" />
    ),
  },
  proud: {
    bodyFill: 'fill-amber-500/85',
    eyeFill: 'fill-amber-900',
    eyeVariant: 'sparkle',
    mouthCurve: 3,
    extra: (
      <g transform="translate(20, 20)">
        <path d="M-10 -10 L0 -15 L10 -10 L0 -5 Z" fill="currentColor" opacity="0.35" />
      </g>
    ),
  },
  celebrating: {
    bodyFill: 'fill-pink-500/85',
    eyeFill: 'fill-pink-900',
    eyeVariant: 'wide',
    mouthCurve: 4,
    extra: (
      <g>
        <circle cx="6" cy="8" r="1.2" fill="currentColor" opacity="0.6" />
        <circle cx="34" cy="8" r="1.2" fill="currentColor" opacity="0.6" />
        <circle cx="34" cy="32" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="6" cy="32" r="1" fill="currentColor" opacity="0.5" />
      </g>
    ),
  },
  zen: {
    bodyFill: 'fill-violet-500/85',
    eyeFill: 'fill-violet-900',
    eyeVariant: 'closed',
    mouthCurve: 1,
    extra: (
      <g opacity="0.4">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="0.4" />
      </g>
    ),
  },
};

function MoodEyes({ variant, fill }: { variant: MoodStyle['eyeVariant']; fill: string }) {
  if (variant === 'closed') {
    return (
      <g className={fill}>
        <path d="M16 18 q1 1 2 0" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M22 18 q1 1 2 0" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </g>
    );
  }
  if (variant === 'sparkle') {
    return (
      <g className={fill}>
        <circle cx="17" cy="18" r="0.8" />
        <circle cx="23" cy="18" r="0.8" />
        <circle cx="17" cy="18" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.6" />
        <circle cx="23" cy="18" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.6" />
      </g>
    );
  }
  if (variant === 'wide') {
    return (
      <g className={fill}>
        <circle cx="17" cy="18" r="1.3" />
        <circle cx="23" cy="18" r="1.3" />
        <circle cx="17" cy="18" r="0.4" fill="white" />
        <circle cx="23" cy="18" r="0.4" fill="white" />
      </g>
    );
  }
  // dot
  return (
    <g className={fill}>
      <circle cx="17" cy="18" r="0.7" />
      <circle cx="23" cy="18" r="0.7" />
    </g>
  );
}

export const ElephantLogo: React.FC<ElephantLogoProps> = ({
  size = 40,
  className = '',
  mood = 'happy',
  animate = true,
}) => {
  const style = MOOD_STYLES[mood];
  const animationClass = animate ? 'transition-transform duration-500 hover:scale-110' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animationClass}`}
      role="img"
      aria-label={`Elephant logo in ${mood} mood`}
    >
      {/* Body fill colored per mood */}
      <g className={style.bodyFill}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35C28.2843 35 35 28.2843 35 20V18C35 15.7909 33.2091 14 31 14H28V12C28 7.58172 24.4183 4 20 4H18C16.8954 4 16 4.89543 16 6V10H14C11.7909 10 10 11.7909 10 14V26C10 27.1046 10.8954 28 12 28H14V30C14 31.1046 14.8954 32 16 32H20C21.1046 32 22 31.1046 22 30V28H28C29.1046 28 30 27.1046 30 26V24H32C33.6569 24 35 22.6569 35 21V20C35 11.7157 28.2843 5 20 5Z"
        />
      </g>
      {/* Eyes */}
      <MoodEyes variant={style.eyeVariant} fill={style.eyeFill} />
      {/* Trunk-tip (mouth) curve hint */}
      <path
        d={`M30 ${24 + style.mouthCurve} q1 ${style.mouthCurve} 2 0`}
        stroke="currentColor"
        strokeWidth="0.5"
        fill="none"
        opacity="0.55"
      />
      {/* Mood-specific extras */}
      {style.extra}
    </svg>
  );
};

/** Map a streak value to a mood. */
export function moodFromStreak(streakDays: number, justCompleted: boolean): ElephantMood {
  if (justCompleted) return 'celebrating';
  if (streakDays >= 7) return 'proud';
  if (streakDays >= 3) return 'happy';
  if (streakDays >= 1) return 'focused';
  return 'sleepy';
}
