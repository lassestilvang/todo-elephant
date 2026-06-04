"use client";

import { Settings, X, Palette, Monitor, Volume2 } from "lucide-react";
import React, { memo, useEffect, useRef } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const ACCENT_COLORS = [
  { name: "Elephant Blue", value: "#3b82f6" },
  { name: "Royal Purple", value: "#8b5cf6" },
  { name: "Sunset Pink", value: "#ec4899" },
  { name: "Forest Green", value: "#10b981" },
  { name: "Golden Amber", value: "#f59e0b" },
  { name: "Ruby Red", value: "#ef4444" },
  { name: "Ocean Teal", value: "#0d9488" },
  { name: "Slate Grey", value: "#64748b" },
];

function SettingsModal({
  isOpen,
  onClose,
  accentColor,
  setAccentColor,
  soundEnabled,
  setSoundEnabled,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (event.target === dialog) {
      onClose();
    }
  };

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem("accent-color", color);
    
    // Dynamically update CSS variable
    const root = document.documentElement;
    
    // Convert hex to HSL for the variable if needed, or just use hex if the theme supports it.
    // The current globals.css uses hsl(var(--accent)).
    // To make it easy, I'll just set it directly as a hex string and hope for the best, 
    // or better yet, I'll add a separate --accent-override variable.
    
    root.style.setProperty("--accent-light", color);
    root.style.setProperty("--accent-dark", color);
    
    // Re-calculating HSL from Hex is complex in pure JS without a library, 
    // so I'll just set the raw color and update the theme to use it.
    root.style.setProperty("--accent", color); 
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="w-full max-w-md rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden p-0 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm focus:outline-none"
    >
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
          <Settings size={16} className="text-accent" />
          <span>App Settings</span>
        </h3>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground hover:bg-muted/20 p-1.5 rounded-xl transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Accent Color Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
            <Palette size={14} />
            <span>Accent Theme Color</span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                title={color.name}
                className={`group relative w-full aspect-square rounded-xl border-2 transition-all hover:scale-105 ${
                  accentColor === color.value 
                    ? "border-foreground shadow-md scale-110" 
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color.value }}
              >
                {accentColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Mode Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
            <Monitor size={14} />
            <span>Display Mode</span>
          </div>
          
          <div className="p-4 rounded-xl bg-muted/10 border border-border/40 text-xs text-muted leading-relaxed">
            Theme switching is available in the sidebar. Todo Elephant supports light, dark, and system preference modes with a premium glassmorphic interface.
          </div>
        </div>

        {/* Sound Effects Toggle */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
            <Volume2 size={14} />
            <span>Preferences</span>
          </div>
          
          <label className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border/40 cursor-pointer transition-all hover:bg-muted/15 select-none">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">Sound Effects</span>
              <p className="text-[10px] text-muted leading-none">Play melodic chimes on task completion</p>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => {
                setSoundEnabled(e.target.checked);
                localStorage.setItem("sound-enabled", e.target.checked ? "true" : "false");
              }}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-background cursor-pointer"
            />
          </label>
        </div>

        {/* About / Credits */}
        <div className="pt-4 border-t border-border/40 text-center">
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">Todo Elephant v1.0.0</p>
          <p className="text-[11px] text-muted/60">The best task planner in the world.</p>
        </div>
      </div>

      <div className="px-6 py-4 bg-muted/5 border-t border-border flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 shadow-md transition-all"
        >
          Done
        </button>
      </div>
    </dialog>
  );
}

export default memo(SettingsModal);
