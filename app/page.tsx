"use client";

import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { 
  Plus, 
  Calendar, 
  Tag, 
  FolderPlus, 
  AlertCircle,
  X,
  Keyboard,
  ListTodo
} from "lucide-react";
import Sidebar from "@/src/components/Sidebar";
import CommandPalette from "@/src/components/CommandPalette";
import DashboardView from "@/src/components/DashboardView";
import KanbanView from "@/src/components/KanbanView";
import ListView from "@/src/components/ListView";
import { Task, List, Label, ActivityLog } from "@/types";

export default function Home() {
  // App views: dashboard, kanban, list
  const [currentView, setView] = useState<"dashboard" | "kanban" | "list">("dashboard");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);

  // States loaded from backend
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Task Creation & Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditingTask, setCurrentEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("pending");
  const [taskListId, setTaskListId] = useState(1);
  const [taskLabelsSelected, setTaskLabelsSelected] = useState<number[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtasksChecklist, setSubtasksChecklist] = useState<{ id: number; title: string; completed: boolean }[]>([]);

  // Listen for Cmd+K or Ctrl+K Command Palette trigger
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        
        // Fetch tasks
        const tRes = await fetch("/api/tasks");
        if (tRes.ok) {
          const tData = await tRes.json();
          setTasks(tData);
        }

        // Fetch lists
        const lRes = await fetch("/api/lists");
        if (lRes.ok) {
          const lData = await lRes.json();
          setLists(lData);
        }

        // Fetch labels
        const tagRes = await fetch("/api/labels");
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setLabels(tagData);
        }

        // Fetch activity logs
        const logRes = await fetch("/api/activity-logs");
        if (logRes.ok) {
          const logData = await logRes.json();
          setActivityLogs(logData);
        }

      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to load initial planner data");
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, []);

  // Refresh logs helper
  const refreshLogs = async () => {
    try {
      const logRes = await fetch("/api/activity-logs");
      if (logRes.ok) {
        const logData = await logRes.json();
        setActivityLogs(logData);
      }
    } catch (err) {
      console.error("Log refresh error:", err);
    }
  };

  // Create or Update task handler
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      if (modalMode === "create") {
        const taskData = {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          dueDate: taskDueDate || new Date().toISOString(),
          priority: taskPriority,
          status: taskStatus,
          listId: Number(taskListId),
          labels: taskLabelsSelected,
          subtasks: subtasksChecklist
        };

        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        });

        if (res.ok) {
          const newTask = await res.json();
          setTasks(prev => [newTask, ...prev]);
          toast.success(`Task "${newTask.title}" created successfully!`);
          refreshLogs();
        } else {
          throw new Error("API error creating task");
        }

      } else if (modalMode === "edit" && currentEditingTask) {
        const taskData = {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          dueDate: taskDueDate,
          priority: taskPriority,
          status: taskStatus,
          listId: Number(taskListId),
          labels: taskLabelsSelected,
          subtasks: subtasksChecklist
        };

        const res = await fetch(`/api/tasks/${currentEditingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        });

        if (res.ok) {
          const updatedTask = await res.json();
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
          toast.success(`Task "${updatedTask.title}" updated successfully!`);
          refreshLogs();
        } else {
          throw new Error("API error updating task");
        }
      }

      setIsModalOpen(false);
      resetForm();

    } catch (err) {
      console.error(err);
      toast.error("Failed to persist task details");
    }
  };

  // Direct fast inline updates (e.g. checkbox status, subtask checked state)
  const handleTaskUpdateDirect = async (id: number, updates: Partial<Task>) => {
    try {
      // Optimistic state updates for instant rendering!
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          // set completedAt if completing
          if (updates.status && (updates.status === "completed" || updates.status === "done")) {
            updated.completedAt = new Date().toISOString();
          } else if (updates.status) {
            updated.completedAt = null;
          }
          return updated;
        }
        return t;
      }));

      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        throw new Error("Inline update failed");
      }
      refreshLogs();
    } catch (err) {
      console.error(err);
      toast.error("Network synchronization failed");
    }
  };

  // Task deletion handler
  const handleTaskDelete = async (id: number) => {
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      
      // Optimistic delete
      setTasks(prev => prev.filter(t => t.id !== id));

      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok || res.status === 204) {
        toast.success(`Deleted task "${taskToDelete?.title || ""}"`);
        refreshLogs();
      } else {
        throw new Error("API error deleting task");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  // Add folder helper
  const handleCreateList = async (name: string, color: string) => {
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color })
      });
      if (res.ok) {
        const newList = await res.json();
        setLists(prev => [...prev, newList]);
        toast.success(`Created Folder "${newList.name}"`);
        refreshLogs();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create folder category");
    }
  };

  // Add Label helper
  const handleCreateLabel = async (name: string, color: string) => {
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color })
      });
      if (res.ok) {
        const newLabel = await res.json();
        setLabels(prev => [...prev, newLabel]);
        toast.success(`Added Label "${newLabel.name}"`);
        refreshLogs();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create label");
    }
  };

  const handleTaskClick = (task: Task) => {
    setCurrentEditingTask(task);
    setModalMode("edit");
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
    setTaskPriority(task.priority || "medium");
    setTaskStatus(task.status || "pending");
    setTaskListId(task.listId || 1);
    setTaskLabelsSelected(task.labels || []);
    setSubtasksChecklist(task.subtasks || []);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskDueDate("");
    setTaskPriority("medium");
    setTaskStatus("pending");
    setTaskListId(1);
    setTaskLabelsSelected([]);
    setSubtasksChecklist([]);
    setNewSubtaskTitle("");
    setCurrentEditingTask(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Filter tasks in view by selected Sidebar options
  const getFilteredTasks = () => {
    return tasks.filter(t => {
      if (selectedListId) return t.listId === selectedListId;
      if (selectedLabelId) return t.labels?.includes(selectedLabelId);
      return true;
    });
  };

  // Add subtask inline helper
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newId = subtasksChecklist.length > 0 ? Math.max(...subtasksChecklist.map(s => s.id)) + 1 : 101;
    setSubtasksChecklist(prev => [...prev, { id: newId, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: number) => {
    setSubtasksChecklist(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex bg-background text-foreground min-h-screen relative overflow-hidden font-sans antialiased">
      
      {/* Toast Notification Container */}
      <Toaster position="bottom-right" richColors theme="system" />

      {/* Main Glassmorphic Sidebar */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        lists={lists}
        labels={labels}
        tasks={tasks}
        selectedListId={selectedListId}
        setSelectedListId={(id) => { setSelectedListId(id); setSelectedLabelId(null); setView("list"); }}
        selectedLabelId={selectedLabelId}
        setSelectedLabelId={(id) => { setSelectedLabelId(id); setSelectedListId(null); setView("list"); }}
        onCreateList={handleCreateList}
        onCreateLabel={handleCreateLabel}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Floating Quick Keyboard Shortcuts Banner */}
        <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-md border border-border text-[10px] text-muted font-bold tracking-tight select-none">
          <Keyboard size={12} />
          <span>Press</span>
          <kbd className="px-1 py-0.5 bg-muted/15 border border-border/40 rounded shadow-sm">Cmd/Ctrl + K</kbd>
          <span>to command</span>
        </div>

        {/* View Switch Router */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin glow-primary" />
            <p className="text-xs text-muted font-semibold">Synchronizing planner database...</p>
          </div>
        ) : (
          <>
            {currentView === "dashboard" && (
              <DashboardView
                tasks={getFilteredTasks()}
                lists={lists}
                labels={labels}
                activityLogs={activityLogs}
                onAddTaskClick={openCreateModal}
                onTaskClick={handleTaskClick}
              />
            )}

            {currentView === "kanban" && (
              <KanbanView
                tasks={getFilteredTasks()}
                lists={lists}
                labels={labels}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskDelete={handleTaskDelete}
                onTaskClick={handleTaskClick}
                onAddTask={(title, status) => {
                  setTaskTitle(title);
                  setTaskStatus(status as any);
                  setModalMode("create");
                  setIsModalOpen(true);
                }}
              />
            )}

            {currentView === "list" && (
              <ListView
                tasks={getFilteredTasks()}
                lists={lists}
                labels={labels}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskDelete={handleTaskDelete}
                onTaskClick={handleTaskClick}
              />
            )}
          </>
        )}

      </main>

      {/* Global Interactive Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        setView={setView}
        onCreateTask={(title) => {
          setTaskTitle(title);
          setModalMode("create");
          setIsModalOpen(true);
        }}
        onSelectTask={handleTaskClick}
      />

      {/* Task Creation & Modification Glass Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card/90 shadow-2xl glass-panel glow-primary overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Top Bar */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                <ListTodo size={16} className="text-accent" />
                <span>{modalMode === "create" ? "Create New Task" : "Edit Planner Task"}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-foreground hover:bg-muted/20 p-1.5 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleTaskSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted uppercase">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Task details and instructions..."
                  rows={2}
                  className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Due Date & Priority Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
                  />
                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

              </div>

              {/* Category Folder & Status Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Category Folder */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">List Folder</label>
                  <select
                    value={taskListId}
                    onChange={e => setTaskListId(Number(e.target.value))}
                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Workflow Status</label>
                  <select
                    value={taskStatus}
                    onChange={e => setTaskStatus(e.target.value as any)}
                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="pending">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

              </div>

              {/* Labels Multi-Select Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase block">Select Labels</label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map(label => {
                    const isSelected = taskLabelsSelected.includes(label.id);
                    return (
                      <button
                        type="button"
                        key={label.id}
                        onClick={() => {
                          if (isSelected) {
                            setTaskLabelsSelected(prev => prev.filter(id => id !== label.id));
                          } else {
                            setTaskLabelsSelected(prev => [...prev, label.id]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-150 ${
                          isSelected
                            ? "bg-accent text-white shadow-sm font-semibold scale-105"
                            : "bg-muted/15 text-muted hover:bg-muted/30 hover:text-foreground"
                        }`}
                      >
                        <Tag size={10} className="shrink-0" style={{ color: label.color }} />
                        <span>{label.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nested Checklist / Subtasks Form */}
              <div className="space-y-3 pt-3 border-t border-border/40">
                <label className="text-[10px] font-bold text-muted uppercase">Checklist Subtasks</label>
                
                {/* Subtask input bar */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add subtask checklist..."
                    className="w-full text-[11px] bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-accent"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-lg bg-accent text-white text-[10px] font-bold hover:bg-accent/90"
                  >
                    Add
                  </button>
                </div>

                {/* Subtasks List */}
                <div className="space-y-1.5">
                  {subtasksChecklist.map((sub, idx) => (
                    <div 
                      key={sub.id}
                      className="flex items-center justify-between gap-3 bg-muted/10 p-2 rounded-xl border border-border/40 text-xs"
                    >
                      <span className="font-medium text-foreground truncate">{sub.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-semibold text-muted hover:text-foreground px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent/95 shadow-md hover-lift glow-primary transition-all"
                >
                  {modalMode === "create" ? "Add Task" : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
