"use client";

import React, { useState } from "react";
import { 
  Tag, 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  Moon, 
  Sun, 
  ChevronRight, 
  Plus,
  TrendingUp
} from "lucide-react";
import { List, Label, Task } from "@/types";

interface SidebarProps {
  currentView: "dashboard" | "kanban" | "list";
  setView: (view: "dashboard" | "kanban" | "list") => void;
  lists: List[];
  labels: Label[];
  tasks: Task[];
  selectedListId: number | null;
  setSelectedListId: (id: number | null) => void;
  selectedLabelId: number | null;
  setSelectedLabelId: (id: number | null) => void;
  onCreateList: (name: string, color: string) => void;
  onCreateLabel: (name: string, color: string) => void;
}

function Sidebar({
  currentView,
  setView,
  lists,
  labels,
  tasks,
  selectedListId,
  setSelectedListId,
  selectedLabelId,
  setSelectedLabelId,
  onCreateList,
  onCreateLabel
}: SidebarProps) {
  const [showAddList, setShowAddList] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#3b82f6");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#64748b");
  
  // Theme state: tracking if dark mode is explicitly enabled
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("color-scheme");
      return (saved as "light" | "dark") || "system";
    }
    return "system";
  });

  const toggleTheme = () => {
    if (typeof window === "undefined") return;
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("color-scheme", nextTheme);
    setThemeMode(nextTheme);
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(newListName.trim(), newListColor);
    setNewListName("");
    setShowAddList(false);
  };

  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onCreateLabel(newLabelName.trim(), newLabelColor);
    setNewLabelName("");
    setShowAddLabel(false);
  };

  // Calculate task counts
  const activeTasks = tasks.filter(t => t.status !== "completed" && t.status !== "done" && t.status !== "archived");
  const completedTasksCount = tasks.filter(t => t.status === "completed" || t.status === "done").length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const colorPresets = [
    "#3b82f6", // Blue
    "#ec4899", // Pink
    "#10b981", // Green
    "#f59e0b", // Orange
    "#8b5cf6", // Purple
    "#ef4444", // Red
  ];

  return (
    <aside className="w-80 border-r border-border bg-card/40 backdrop-blur-xl flex flex-col h-screen select-none relative z-10">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-primary">
            <span className="text-2xl">🐘</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Todo Elephant</h1>
            <span className="text-xs text-muted font-medium">Daily Task Planner</span>
          </div>
        </div>
      </div>

      {/* Navigation Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        
        {/* Layout Navigation */}
        <nav aria-label="View navigation" className="space-y-1">
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase px-3 mb-2">Views</h3>
          <button
            onClick={() => { setView("dashboard"); setSelectedListId(null); setSelectedLabelId(null); }}
            aria-current={currentView === "dashboard" && !selectedListId && !selectedLabelId ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              currentView === "dashboard" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold"
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span>Dashboard Overview</span>
            <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />
          </button>
          
          <button
            onClick={() => { setView("kanban"); setSelectedListId(null); setSelectedLabelId(null); }}
            aria-current={currentView === "kanban" && !selectedListId && !selectedLabelId ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              currentView === "kanban" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold"
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            <KanbanSquare size={18} className="shrink-0" />
            <span>Kanban Board</span>
            <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />
          </button>

          <button
            onClick={() => { setView("list"); setSelectedListId(null); setSelectedLabelId(null); }}
            aria-current={currentView === "list" && !selectedListId && !selectedLabelId ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              currentView === "list" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold"
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            <ListTodo size={18} className="shrink-0" />
            <span>High-Density List</span>
            <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />
          </button>
        </nav>

        {/* Categories / Lists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Folders</h3>
            <button 
              onClick={() => setShowAddList(!showAddList)}
              aria-label="Add folder"
              className="text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {showAddList && (
            <form onSubmit={handleCreateList} className="p-3 mb-2 rounded-xl bg-muted/20 border border-border space-y-3 animate-fade-in">
              <input
                type="text"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <div className="flex flex-wrap gap-1.5">
                {colorPresets.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {newListColor === color && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddList(false)}
                  className="text-[11px] font-semibold text-muted hover:text-foreground px-2 py-1 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-[11px] font-semibold bg-accent text-white hover:bg-accent/95 px-2 py-1 rounded glow-primary"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {lists.map(list => {
              const listTasks = tasks.filter(t => t.listId === list.id && t.status !== "completed" && t.status !== "done" && t.status !== "archived");
              return (
                <button
                  key={list.id}
                  onClick={() => { setSelectedListId(list.id); setSelectedLabelId(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    selectedListId === list.id
                      ? "bg-accent/10 text-accent font-semibold"
                      : "text-muted hover:bg-muted/10 hover:text-foreground"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                  <span className="truncate">{list.name}</span>
                  <span className="ml-auto text-xs opacity-60 font-semibold bg-muted/20 px-2 py-0.5 rounded-full shrink-0">
                    {listTasks.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels / Tags */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Labels</h3>
            <button 
              onClick={() => setShowAddLabel(!showAddLabel)}
              aria-label="Add label"
              className="text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {showAddLabel && (
            <form onSubmit={handleCreateLabel} className="p-3 mb-2 rounded-xl bg-muted/20 border border-border space-y-3 animate-fade-in">
              <input
                type="text"
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                placeholder="Tag name..."
                autoFocus
                className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <div className="flex flex-wrap gap-1.5">
                {colorPresets.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {newLabelColor === color && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddLabel(false)}
                  className="text-[11px] font-semibold text-muted hover:text-foreground px-2 py-1 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-[11px] font-semibold bg-accent text-white hover:bg-accent/95 px-2 py-1 rounded glow-primary"
                >
                  Add Label
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-1.5 px-3">
            {labels.map(label => (
              <button
                key={label.id}
                onClick={() => { setSelectedLabelId(label.id); setSelectedListId(null); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all duration-150 ${
                  selectedLabelId === label.id
                    ? "bg-accent text-white shadow-sm font-semibold scale-105"
                    : "bg-muted/15 text-muted hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                <Tag size={10} className="shrink-0" style={{ color: label.color }} />
                <span>{label.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Area: Stats & Theme Toggler */}
      <div className="p-4 border-t border-border bg-muted/5 flex flex-col gap-4">
        
        {/* Simple Progress Ring Display */}
        <div className="flex items-center gap-3 bg-muted/10 p-3 rounded-xl">
          <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 radial-progress-ring">
              <circle
                className="text-border"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="transparent"
                r="16"
                cx="20"
                cy="20"
              />
              <circle
                className="text-accent transition-all duration-500"
                strokeWidth="3.5"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - completionPercentage / 100)}`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="16"
                cx="20"
                cy="20"
              />
            </svg>
            <span className="absolute text-[11px] font-bold">{completionPercentage}%</span>
          </div>
          <div>
            <div className="flex items-center gap-1 font-semibold text-xs text-foreground">
              <TrendingUp size={12} className="text-accent" />
              <span>Planner Progress</span>
            </div>
            <p className="text-[11px] text-muted font-medium">{activeTasks.length} tasks remaining</p>
          </div>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground border border-border hover:bg-muted/10 transition-all duration-200"
        >
          {themeMode === "light" ? (
            <>
              <Moon size={14} />
              <span>Toggle Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={14} />
              <span>Toggle Light Mode</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);
