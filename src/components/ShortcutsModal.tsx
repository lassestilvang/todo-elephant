import React from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal = ({ isOpen, onClose }: ShortcutsModalProps) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "n", description: "Create new task" },
    { key: "1", description: "Switch to Dashboard" },
    { key: "2", description: "Switch to Kanban" },
    { key: "3", description: "Switch to List" },
    { key: "⌘ K", description: "Open Command Palette" },
    { key: "⌘ ,", description: "Open Settings" },
    { key: "?", description: "Show this help" },
    { key: "Esc", description: "Close modals / palette" },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl glass-panel glow-primary overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/5">
          <div className="flex items-center gap-2">
            <Keyboard size={20} className="text-accent" />
            <h2 className="text-lg font-bold tracking-tight">Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-muted hover:text-foreground hover:bg-muted/20 p-1.5 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm font-medium text-foreground">{s.description}</span>
                <kbd className="px-2 py-1 text-xs font-bold text-accent bg-accent/10 border border-accent/20 rounded-lg min-w-[32px] text-center shadow-sm">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/5 border-t border-border text-center">
          <p className="text-[11px] text-muted font-medium">
            Pro tip: Use these shortcuts to fly through your task list!
          </p>
        </div>
      </div>
    </div>
  );
};
