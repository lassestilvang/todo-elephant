"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Keyboard, Sparkles, Folder, Plus, Sun, Moon, Palette } from "lucide-react";
import { Task } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  setView: (view: "dashboard" | "kanban" | "list") => void;
  onCreateTask: (title: string) => void;
  onSelectTask: (task: Task) => void;
  setThemeMode?: (mode: "light" | "dark" | "system") => void;
  setAccentColor?: (color: string) => void;
  onOpenShortcuts?: () => void;
}

function CommandPalette({
  isOpen,
  onClose,
  tasks,
  setView,
  onCreateTask,
  onSelectTask,
  setThemeMode,
  setAccentColor,
  onOpenShortcuts
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
        // Reset state when opening (using timeout to avoid cascading renders warning)
        setTimeout(() => {
          setQuery("");
          setSelectedIndex(0);
          inputRef.current?.focus();
        }, 0);
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
  const viewCommands = useMemo(() => {
    const list = [
      { id: "v-dash", title: "Switch to Dashboard Overview", type: "navigation", action: () => { setView("dashboard"); } },
      { id: "v-kanb", title: "Switch to Kanban Board View", type: "navigation", action: () => { setView("kanban"); } },
      { id: "v-list", title: "Switch to High-Density List View", type: "navigation", action: () => { setView("list"); } },
      { id: "v-eise", title: "Switch to Eisenhower Matrix View", type: "navigation", action: () => { setView("eisenhower"); } }
    ];

    if (setThemeMode) {
      list.push(
        { id: "t-light", title: "Theme: Switch to Light Mode", type: "theme", action: () => { setThemeMode("light"); } },
        { id: "t-dark", title: "Theme: Switch to Dark Mode", type: "theme", action: () => { setThemeMode("dark"); } },
        { id: "t-system", title: "Theme: Switch to System Mode", type: "theme", action: () => { setThemeMode("system"); } }
      );
    }

    if (setAccentColor) {
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
      ACCENT_COLORS.forEach(color => {
        list.push({
          id: `a-${color.name.toLowerCase().replace(" ", "-")}`,
          title: `Accent: Set to ${color.name}`,
          type: "accent",
          action: () => {
            setAccentColor(color.value);
            localStorage.setItem("accent-color", color.value);
            const root = document.documentElement;
            root.style.setProperty("--accent-light", color.value);
            root.style.setProperty("--accent-dark", color.value);
            root.style.setProperty("--accent", color.value);
          }
        });
      });
    }

    if (onOpenShortcuts) {
      list.push({
        id: "v-shortcuts",
        title: "Help: Show Keyboard Shortcuts Dialog",
        type: "navigation",
        action: () => { onOpenShortcuts(); }
      });
    }

    return list;
  }, [setView, setThemeMode, setAccentColor, onOpenShortcuts]);

  // Combine commands and tasks matching query
  const sections = useMemo(() => {
    const matchedCommands = viewCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
    
    const matchedTasks = query
      ? tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || (t.description || "").toLowerCase().includes(query.toLowerCase()))
      : tasks.slice(0, 5); // Show first 5 tasks if query is empty

    interface CommandItem {
      id: string;
      title: string;
      type: string;
      subtitle?: string;
      priority?: string;
      action: () => void;
    }
    const groups: { title: string; items: CommandItem[] }[] = [];

    if (matchedCommands.length > 0) {
      groups.push({
        title: "Navigation & Actions",
        items: matchedCommands.map(c => ({ ...c, type: "navigation" }))
      });
    }

    if (matchedTasks.length > 0) {
      groups.push({
        title: query ? "Matching Tasks" : "Recent Tasks",
        items: matchedTasks.map(t => ({ 
          id: `t-${t.id}`, 
          title: t.title, 
          type: "task", 
          subtitle: t.description,
          priority: t.priority,
          action: () => onSelectTask(t) 
        }))
      });
    }

    if (query.trim() && matchedTasks.length === 0 && matchedCommands.length === 0) {
      groups.push({
        title: "Quick Create",
        items: [{
          id: "create-new-task",
          title: `Create task "${query.trim()}"`,
          type: "create",
          action: () => {
            onCreateTask(query.trim());
            setQuery("");
            onClose();
          }
        }]
      });
    }

    return groups;
  }, [query, tasks, viewCommands, onSelectTask, onCreateTask, onClose]);

  // Flattened items for keyboard navigation
  const flatItems = useMemo(() => sections.flatMap(s => s.items), [sections]);

  // Handle keyboard navigation inside the open dialog
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  // Clamp selected index to valid range
  const clampedIndex = flatItems.length > 0 ? Math.min(selectedIndex, flatItems.length - 1) : 0;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      className="fixed top-[15vh] mx-auto w-full max-w-xl rounded-2xl border border-border bg-card/95 shadow-2xl glass-panel glow-primary overflow-hidden p-0 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm focus:outline-none animate-scale-up"
    >
      {/* Input Bar */}
      <div className="flex items-center gap-3 px-5 border-b border-border py-5 bg-muted/5">
        <Search size={22} className="text-accent shrink-0" />
        <input
          ref={inputRef}
          id="command-palette-search"
          name="command-palette-search"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tasks, navigate views, or type to create..."
          aria-label="Search and create tasks"
          className="w-full bg-transparent border-0 outline-none text-foreground placeholder:text-muted/50 text-base focus:ring-0 focus:outline-none font-medium"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-muted bg-muted/20 border border-border/40 rounded shadow-sm">ESC</kbd>
        </div>
      </div>

      {/* Results List */}
      <div className="max-h-[420px] overflow-y-auto p-2 scrollbar-none">
        {sections.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Sparkles size={32} className="text-accent/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No matches found</p>
            <p className="text-xs text-muted mt-1">Press enter to create a new task with this name.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold text-muted uppercase tracking-widest">{section.title}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const globalIdx = flatItems.indexOf(item);
                    const isSelected = globalIdx === clampedIndex;
                    
                    const priorityColor = {
                      high: "bg-red-500",
                      medium: "bg-amber-500",
                      low: "bg-blue-500"
                    }[item.priority as "high" | "medium" | "low"] || "bg-muted";

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-accent text-white shadow-lg shadow-accent/20 scale-[1.01]"
                            : "text-muted hover:bg-muted/10 hover:text-foreground"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-white/20" : "bg-muted/15"
                        }`}>
                          {item.type === "navigation" && <Sparkles size={16} className={isSelected ? "text-white" : "text-accent"} />}
                          {item.type === "task" && <Folder size={16} className={isSelected ? "text-white" : "text-emerald-500"} />}
                          {item.type === "create" && <Plus size={16} className={isSelected ? "text-white" : "text-accent"} />}
                          {item.type === "theme" && <Moon size={16} className={isSelected ? "text-white" : "text-indigo-400"} />}
                          {item.type === "accent" && <Palette size={16} className={isSelected ? "text-white" : "text-amber-500"} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-foreground"}`}>
                              {item.title}
                            </span>
                            {item.type === "task" && (
                              <div className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} />
                            )}
                          </div>
                          {item.subtitle && (
                            <p className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-white/70" : "text-muted"}`}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>

                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 uppercase tracking-tighter ${
                          isSelected ? "bg-white/20 text-white" : "bg-muted/10 text-muted"
                        }`}>
                          {isSelected ? "↵ Enter" : item.type}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
