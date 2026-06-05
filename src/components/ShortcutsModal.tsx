import React, { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal = ({ isOpen, onClose }: ShortcutsModalProps) => {
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

  // Synchronize close state when native cancel happens (e.g., Esc key)
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

  // Backdrop click fallback for light dismiss
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (event.target === dialog) {
      onClose();
    }
  };

  const shortcuts = [
    { key: "n", description: "Create new task" },
    { key: "1", description: "Switch to Dashboard" },
    { key: "2", description: "Switch to Kanban" },
    { key: "3", description: "Switch to List" },
    { key: "/", description: "Focus search input" },
    { key: "⌘ K", description: "Open Command Palette" },
    { key: "⌘ ,", description: "Open Settings" },
    { key: "?", description: "Show this help" },
    { key: "Esc", description: "Close modals / palette" },
  ];

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="w-full max-w-md rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden p-0 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm focus:outline-none"
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
    </dialog>
  );
};
