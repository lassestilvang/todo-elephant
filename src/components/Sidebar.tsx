"use client";

import React, { useState } from "react";
import { ElephantLogo } from "./ElephantLogo";
import { 
  Tag, 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  Moon, 
  Sun, 
  ChevronRight, 
  Plus,
  TrendingUp,
  Settings,
  Search,
  LayoutGrid
} from "lucide-react";
import { List, Label, Task, SavedFilter } from "@/types";

interface SidebarProps {
  currentView: "dashboard" | "kanban" | "list" | "eisenhower";
  setView: (view: "dashboard" | "kanban" | "list" | "eisenhower") => void;
  lists: List[];
  labels: Label[];
  tasks: Task[];
  savedFilters: SavedFilter[];
  selectedListId: number | null;
  setSelectedListId: (id: number | null) => void;
  selectedLabelId: number | null;
  setSelectedLabelId: (id: number | null) => void;
  onCreateList: (name: string, color: string) => void;
  onCreateLabel: (name: string, color: string) => void;
  onOpenSettings: () => void;
  themeMode: "light" | "dark" | "system";
  updateTheme: (mode: "light" | "dark" | "system") => void;
  isZenMode?: boolean;
  setIsZenMode?: (v: boolean) => void;
}

function Sidebar({
  currentView,
  setView,
  lists,
  labels,
  tasks,
  savedFilters,
  selectedListId,
  setSelectedListId,
  selectedLabelId,
  setSelectedLabelId,
  onCreateList,
  onCreateLabel,
  onOpenSettings,
  themeMode,
  updateTheme,
  isZenMode,
  setIsZenMode
}: SidebarProps) {
  const [showAddList, setShowAddList] = useState(false);
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#3b82f6");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#64748b");
  
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [showListSearch, setShowListSearch] = useState(false);
  const [labelSearchQuery, setLabelSearchQuery] = useState("");
  const [showLabelSearch, setShowLabelSearch] = useState(false);

  const filteredLists = lists.filter(list => 
    list.name.toLowerCase().includes(listSearchQuery.toLowerCase())
  );

  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(labelSearchQuery.toLowerCase())
  );
  
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
          <div 
            onClick={() => {
              const win = window as Window & { triggerConfetti?: () => void };
              if (win.triggerConfetti) win.triggerConfetti();
            }}
            className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-primary overflow-hidden group/logo cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <ElephantLogo size={28} className="text-white transition-transform duration-500 ease-out group-hover/logo:scale-115 group-hover/logo:-rotate-12" />
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              currentView === "dashboard" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold shadow-inner"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              currentView === "kanban" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold shadow-inner"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              currentView === "list" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold shadow-inner"
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            <ListTodo size={18} className="shrink-0" />
            <span>High-Density List</span>
            <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />
          </button>

          <button
            onClick={() => { setView("eisenhower"); setSelectedListId(null); setSelectedLabelId(null); }}
            aria-current={currentView === "eisenhower" && !selectedListId && !selectedLabelId ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              currentView === "eisenhower" && !selectedListId && !selectedLabelId
                ? "bg-accent/10 text-accent font-semibold shadow-inner"
                : "text-muted hover:bg-muted/10 hover:text-foreground"
            }`}
          >
            <LayoutGrid size={18} className="shrink-0" />
            <span>Eisenhower Matrix</span>
            <ChevronRight size={14} className="ml-auto opacity-40 shrink-0" />
          </button>
        </nav>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase px-3 mb-2 flex items-center justify-between">
              Saved Filters
            </h3>
            {savedFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => { /* TODO: apply filter */ }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:bg-muted/10 hover:text-foreground transition-all"
              >
                <Search size={16} />
                <span className="truncate">{filter.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Categories / Lists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Folders</h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setShowListSearch(!showListSearch); if (showListSearch) setListSearchQuery(""); }}
                aria-label="Search folders"
                className={`text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors ${showListSearch ? "text-accent bg-accent/10" : ""}`}
              >
                <Search size={14} />
              </button>
              <button 
                onClick={() => setShowAddList(!showAddList)}
                aria-label="Add folder"
                className="text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {showListSearch && (
            <div className="px-3 mb-2 animate-fade-in">
              <input
                type="text"
                value={listSearchQuery}
                onChange={e => setListSearchQuery(e.target.value)}
                placeholder="Search folders..."
                className="w-full text-xs bg-background/50 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

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
            {filteredLists.map(list => {
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
            {filteredLists.length === 0 && listSearchQuery && (
              <div className="text-center py-2 text-xs text-muted">No folders found</div>
            )}
          </div>
        </div>

        {/* Labels / Tags */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Labels</h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setShowLabelSearch(!showLabelSearch); if (showLabelSearch) setLabelSearchQuery(""); }}
                aria-label="Search labels"
                className={`text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors ${showLabelSearch ? "text-accent bg-accent/10" : ""}`}
              >
                <Search size={14} />
              </button>
              <button 
                onClick={() => setShowAddLabel(!showAddLabel)}
                aria-label="Add label"
                className="text-muted hover:text-foreground hover:bg-muted/20 p-1 rounded-lg transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {showLabelSearch && (
            <div className="px-3 mb-2 animate-fade-in">
              <input
                type="text"
                value={labelSearchQuery}
                onChange={e => setLabelSearchQuery(e.target.value)}
                placeholder="Search labels..."
                className="w-full text-xs bg-background/50 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

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
            {filteredLabels.map(label => {
              const labelTasks = tasks.filter(t => t.labels?.includes(label.id) && t.status !== "completed" && t.status !== "done" && t.status !== "archived");
              return (
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
                  <span className={`text-[10px] opacity-75 font-bold px-1.5 py-0.2 rounded-full ${
                    selectedLabelId === label.id ? "bg-white/20 text-white" : "bg-muted/30 text-muted"
                  }`}>
                    {labelTasks.length}
                  </span>
                </button>
              );
            })}
            {filteredLabels.length === 0 && labelSearchQuery && (
              <div className="w-full text-center py-2 text-xs text-muted">No labels found</div>
            )}
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

        {/* Theme & Settings Row */}
        <div className="flex flex-col gap-2">
          {/* Theme Switcher Segment Control */}
          <div className="flex p-1 bg-muted/10 rounded-xl border border-border">
            {(["light", "system", "dark"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => updateTheme(mode)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  themeMode === mode
                    ? "bg-card text-accent shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {mode === "light" && <Sun size={12} />}
                {mode === "system" && <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent rotate-45 shrink-0" />}
                {mode === "dark" && <Moon size={12} />}
                <span>{mode}</span>
              </button>
            ))}
          </div>

          {/* Settings & Zen Row */}
          <div className="flex gap-2">
            <button
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground border border-border hover:bg-muted/10 transition-all duration-200"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>

            {setIsZenMode && (
              <button
                onClick={() => setIsZenMode(true)}
                title="Enter Zen Mode"
                className="flex items-center justify-center px-3 py-2 rounded-xl border border-border text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
              >
                <Monitor size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);
