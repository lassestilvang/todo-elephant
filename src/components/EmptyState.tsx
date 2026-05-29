"use client";

import React from "react";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "tasks" | "search" | "filter" | "default";
}

function EmptyIllustration({ variant }: { variant: string }) {
  if (variant === "tasks") {
    return (
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="mx-auto"
        aria-hidden="true"
      >
        {/* Floating circles background */}
        <circle cx="60" cy="60" r="50" fill="hsl(var(--accent) / 0.06)" />
        <circle cx="60" cy="60" r="35" fill="hsl(var(--accent) / 0.04)" />

        {/* Clipboard body */}
        <rect x="38" y="28" width="44" height="58" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Clipboard clip */}
        <rect x="48" y="22" width="24" height="12" rx="4" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent) / 0.3)" strokeWidth="1" />
        <circle cx="60" cy="28" r="2" fill="hsl(var(--accent) / 0.5)" />

        {/* Check lines */}
        <rect x="46" y="44" width="28" height="2.5" rx="1.25" fill="hsl(var(--accent) / 0.2)" />
        <rect x="46" y="52" width="22" height="2.5" rx="1.25" fill="hsl(var(--accent) / 0.15)" />
        <rect x="46" y="60" width="26" height="2.5" rx="1.25" fill="hsl(var(--accent) / 0.12)" />
        <rect x="46" y="68" width="18" height="2.5" rx="1.25" fill="hsl(var(--accent) / 0.1)" />

        {/* Floating plus */}
        <circle cx="88" cy="42" r="10" fill="hsl(var(--accent) / 0.12)" stroke="hsl(var(--accent) / 0.25)" strokeWidth="1">
          <animate attributeName="cy" values="42;38;42" dur="3s" repeatCount="indefinite" />
        </circle>
        <line x1="88" y1="37" x2="88" y2="47" stroke="hsl(var(--accent) / 0.5)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="y1" values="37;33;37" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y2" values="47;43;47" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="83" y1="42" x2="93" y2="42" stroke="hsl(var(--accent) / 0.5)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="y1" values="42;38;42" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y2" values="42;38;42" dur="3s" repeatCount="indefinite" />
        </line>

        {/* Decorative dots */}
        <circle cx="22" cy="50" r="2" fill="hsl(var(--accent) / 0.15)">
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="72" r="1.5" fill="hsl(var(--accent) / 0.2)">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="28" cy="82" r="1" fill="hsl(var(--accent) / 0.25)">
          <animate attributeName="opacity" values="0.25;0.5;0.25" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  if (variant === "search") {
    return (
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="mx-auto"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="50" fill="hsl(var(--accent) / 0.06)" />

        {/* Magnifying glass */}
        <circle cx="52" cy="52" r="20" fill="none" stroke="hsl(var(--accent) / 0.25)" strokeWidth="2.5" />
        <line x1="66" y1="66" x2="80" y2="80" stroke="hsl(var(--accent) / 0.3)" strokeWidth="3" strokeLinecap="round" />

        {/* X mark inside */}
        <line x1="46" y1="46" x2="58" y2="58" stroke="hsl(var(--accent) / 0.35)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.35;0.5;0.35" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="58" y1="46" x2="46" y2="58" stroke="hsl(var(--accent) / 0.35)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.35;0.5;0.35" dur="2s" repeatCount="indefinite" />
        </line>

        {/* Floating dots */}
        <circle cx="25" cy="40" r="1.5" fill="hsl(var(--accent) / 0.2)">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="95" cy="55" r="1" fill="hsl(var(--accent) / 0.25)">
          <animate attributeName="opacity" values="0.25;0.45;0.25" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  if (variant === "filter") {
    return (
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="mx-auto"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="50" fill="hsl(var(--accent) / 0.06)" />

        {/* Funnel */}
        <path d="M35 35h50l-15 25v20l-20 10V60L35 35z" fill="hsl(var(--accent) / 0.08)" stroke="hsl(var(--accent) / 0.25)" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Dots flowing out */}
        <circle cx="52" cy="85" r="2" fill="hsl(var(--accent) / 0.3)">
          <animate attributeName="cy" values="85;90;85" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="88" r="1.5" fill="hsl(var(--accent) / 0.25)">
          <animate attributeName="cy" values="88;93;88" dur="2.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="68" cy="85" r="2" fill="hsl(var(--accent) / 0.2)">
          <animate attributeName="cy" values="85;92;85" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      className="mx-auto"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="50" fill="hsl(var(--accent) / 0.06)" />

      {/* Abstract task board */}
      <rect x="30" y="35" width="22" height="50" rx="4" fill="hsl(var(--accent) / 0.06)" stroke="hsl(var(--accent) / 0.15)" strokeWidth="1" />
      <rect x="49" y="42" width="22" height="43" rx="4" fill="hsl(var(--accent) / 0.08)" stroke="hsl(var(--accent) / 0.18)" strokeWidth="1" />
      <rect x="68" y="30" width="22" height="55" rx="4" fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent) / 0.2)" strokeWidth="1" />

      {/* Floating items */}
      <rect x="34" y="42" width="14" height="3" rx="1.5" fill="hsl(var(--accent) / 0.2)">
        <animate attributeName="y" values="42;39;42" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="34" y="50" width="10" height="3" rx="1.5" fill="hsl(var(--accent) / 0.15)">
        <animate attributeName="y" values="50;47;50" dur="3.2s" repeatCount="indefinite" />
      </rect>
      <rect x="53" y="48" width="14" height="3" rx="1.5" fill="hsl(var(--accent) / 0.2)">
        <animate attributeName="y" values="48;45;48" dur="2.8s" repeatCount="indefinite" />
      </rect>
      <rect x="72" y="36" width="14" height="3" rx="1.5" fill="hsl(var(--accent) / 0.25)">
        <animate attributeName="y" values="36;33;36" dur="2.6s" repeatCount="indefinite" />
      </rect>
      <rect x="72" y="44" width="10" height="3" rx="1.5" fill="hsl(var(--accent) / 0.18)">
        <animate attributeName="y" values="44;41;44" dur="3.1s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className="py-16 text-center space-y-5 select-none">
      <EmptyIllustration variant={variant} />
      <div className="space-y-1.5">
        <p className="text-base font-bold text-foreground">{title}</p>
        <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 shadow-md hover-lift glow-primary transition-all duration-200"
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default React.memo(EmptyState);
