"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Keyboard, Sparkles, Folder, Calendar, Plus } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Close palette on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Command palette filter options
  const viewCommands = [
    { id: "v-dash", title: "Switch to Dashboard Overview", type: "navigation", action: () => setView("dashboard") },
    { id: "v-kanb", title: "Switch to Kanban Board View", type: "navigation", action: () => setView("kanban") },
    { id: "v-list", title: "Switch to High-Density List View", type: "navigation", action: () => setView("list") }
  ];

  // Filter tasks based on query
  const filteredTasks = query
    ? tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || (t.description || "").toLowerCase().includes(query.toLowerCase()))
    : [];

  const matchedCommands = viewCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  // Combine commands and tasks matching query
  const items = [
    ...matchedCommands,
    ...filteredTasks.map(t => ({ id: `t-${t.id}`, title: `Search Task: ${t.title}`, type: "task", action: () => onSelectTask(t) }))
  ];

  // If query is present and no tasks matches, add "Create Task" command
  if (query.trim() && items.length === 0) {
    items.push({
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

  // Handle keyboard navigation
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
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div 
        ref={containerRef}
        className="w-full max-w-xl rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden animate-scale-up"
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
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 ${
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
      </div>
    </div>
  );
}

export default React.memo(CommandPalette);
