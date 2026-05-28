"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Keyboard, Sparkles, Folder, Plus } from "lucide-react";
import { Task } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  setView: (view: "dashboard" | "kanban" | "list") => void;
  onCreateTask: (title: string) => void;
  onSelectTask: (task: Task) => void;
}

function CommandPalette({
  isOpen,
  onClose,
  tasks,
  setView,
  onCreateTask,
  onSelectTask
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setQuery("");
        setSelectedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 50);
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
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isDialogContent) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  // Command palette filter options
  const viewCommands = useMemo(() => [
    { id: "v-dash", title: "Switch to Dashboard Overview", type: "navigation", action: () => setView("dashboard") },
    { id: "v-kanb", title: "Switch to Kanban Board View", type: "navigation", action: () => setView("kanban") },
    { id: "v-list", title: "Switch to High-Density List View", type: "navigation", action: () => setView("list") }
  ], [setView]);

  // Combine commands and tasks matching query
  const items = useMemo(() => {
    const filteredTasks = query
      ? tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || (t.description || "").toLowerCase().includes(query.toLowerCase()))
      : [];

    const matchedCommands = viewCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

    const result = [
      ...matchedCommands,
      ...filteredTasks.map(t => ({ id: `t-${t.id}`, title: `Search Task: ${t.title}`, type: "task", action: () => onSelectTask(t) }))
    ];

    if (query.trim() && result.length === 0) {
      result.push({
        id: "create-new-task",
        title: `Create new task: "${query.trim()}"`,
        type: "create",
        action: () => {
          onCreateTask(query.trim());
          setQuery("");
          onClose();
        }
      });
    }

    return result;
  }, [query, tasks, viewCommands, onSelectTask, onCreateTask, onClose]);

  // Handle keyboard navigation inside the open dialog
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].action();
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Clamp selected index to valid range
  const clampedIndex = items.length > 0 ? Math.min(selectedIndex, items.length - 1) : 0;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-label="Command palette"
      className="fixed top-[15vh] mx-auto w-full max-w-xl rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden p-0 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm focus:outline-none animate-scale-up"
    >
      {/* Input Bar */}
      <div className="flex items-center gap-3 px-4 border-b border-border py-4">
        <Search size={20} className="text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command or search for tasks..."
          className="w-full bg-transparent border-0 outline-none text-foreground placeholder:text-muted/60 text-sm focus:ring-0 focus:outline-none"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[11px] font-bold text-muted bg-muted/20 border border-border/40 rounded-lg select-none shrink-0 shadow-sm">
          ESC
        </kbd>
      </div>

      {/* Results List */}
      <div className="max-h-[350px] overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Sparkles size={24} className="text-accent/60 mx-auto mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">No matches found</p>
            <p className="text-xs text-muted mt-1">Type something to create a new task instantly!</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item, idx) => {
              const isSelected = idx === clampedIndex;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-accent text-white shadow-md font-semibold scale-[1.01]"
                      : "text-muted hover:bg-muted/10 hover:text-foreground"
                  }`}
                >
                  {item.type === "navigation" && <Sparkles size={16} className={isSelected ? "text-white" : "text-accent"} />}
                  {item.type === "task" && <Folder size={16} className={isSelected ? "text-white" : "text-emerald-500"} />}
                  {item.type === "create" && <Plus size={16} className={isSelected ? "text-white" : "text-accent"} />}
                  <span className="truncate flex-1">{item.title}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted/10 text-muted"
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Help Footer */}
      <div className="px-4 py-3 bg-muted/5 border-t border-border flex items-center justify-between text-[11px] text-muted font-medium select-none">
        <div className="flex items-center gap-1.5">
          <Keyboard size={12} />
          <span>Use <span className="font-bold">↑↓</span> to navigate, <span className="font-bold">Enter</span> to select</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Press</span>
          <kbd className="px-1 bg-muted/15 border border-border/40 rounded text-[11px] font-bold">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1 bg-muted/15 border border-border/40 rounded text-[11px] font-bold">K</kbd>
          <span>anytime</span>
        </div>
      </div>
    </dialog>
  );
}

export default React.memo(CommandPalette);
