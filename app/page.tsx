"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { 
  Keyboard,
  Menu,
} from "lucide-react";
import dynamic from "next/dynamic";
import Sidebar from "@/src/components/Sidebar";
import CommandPalette from "@/src/components/CommandPalette";
import TaskModal from "@/src/components/TaskModal";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import { Task, List, Label, ActivityLog } from "@/types";

const DashboardView = dynamic(() => import("@/src/components/DashboardView"));
const KanbanView = dynamic(() => import("@/src/components/KanbanView"));
const ListView = dynamic(() => import("@/src/components/ListView"));

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Fetch initial data in parallel
  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);

        const [tRes, lRes, tagRes, logRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/lists"),
          fetch("/api/labels"),
          fetch("/api/activity-logs"),
        ]);

        const [tData, lData, tagData, logData] = await Promise.all([
          tRes.ok ? tRes.json() : [],
          lRes.ok ? lRes.json() : [],
          tagRes.ok ? tagRes.json() : [],
          logRes.ok ? logRes.json() : [],
        ]);

        setTasks(tData);
        setLists(lData);
        setLabels(tagData);
        setActivityLogs(logData);
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
  const refreshLogs = useCallback(async () => {
    try {
      const logRes = await fetch("/api/activity-logs");
      if (logRes.ok) {
        const logData = await logRes.json();
        setActivityLogs(logData);
      }
    } catch (err) {
      console.error("Log refresh error:", err);
    }
  }, []);

  const resetForm = useCallback(() => {
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
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalMode("create");
    setIsModalOpen(true);
  }, [resetForm]);

  // Create or Update task handler
  const handleTaskSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [taskTitle, taskDesc, taskDueDate, taskPriority, taskStatus, taskListId, taskLabelsSelected, subtasksChecklist, modalMode, currentEditingTask, refreshLogs, resetForm, isSubmitting]);

  // Direct fast inline updates (e.g. checkbox status, subtask checked state)
  const handleTaskUpdateDirect = useCallback(async (id: number, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
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
  }, [refreshLogs]);

  // Task deletion handler
  const handleTaskDelete = useCallback(async (id: number) => {
    try {
      const taskToDelete = tasks.find(t => t.id === id);

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
  }, [tasks, refreshLogs]);

  const requestDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId !== null) {
      handleTaskDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, handleTaskDelete]);

  // Add folder helper
  const handleCreateList = useCallback(async (name: string, color: string) => {
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
  }, [refreshLogs]);

  // Add Label helper
  const handleCreateLabel = useCallback(async (name: string, color: string) => {
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
  }, [refreshLogs]);

  const handleTaskClick = useCallback((task: Task) => {
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
  }, []);

  // Filter tasks in view by selected Sidebar options
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedListId) return t.listId === selectedListId;
      if (selectedLabelId) return t.labels?.includes(selectedLabelId);
      return true;
    });
  }, [tasks, selectedListId, selectedLabelId]);

  // Add subtask inline helper
  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return;
    const newId = subtasksChecklist.length > 0 ? Math.max(...subtasksChecklist.map(s => s.id)) + 1 : 101;
    setSubtasksChecklist(prev => [...prev, { id: newId, title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  }, [newSubtaskTitle, subtasksChecklist]);

  const handleRemoveSubtask = useCallback((id: number) => {
    setSubtasksChecklist(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <div className="flex bg-background text-foreground min-h-screen relative overflow-hidden font-sans antialiased">
      
      {/* Toast Notification Container */}
      <Toaster position="bottom-right" richColors theme="system" />

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Glassmorphic Sidebar */}
      <div className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-40 transition-transform duration-300 ease-in-out`}>
        <Sidebar
          currentView={currentView}
          setView={(v) => { setView(v); setIsSidebarOpen(false); }}
          lists={lists}
          labels={labels}
          tasks={tasks}
          selectedListId={selectedListId}
          setSelectedListId={(id) => { setSelectedListId(id); setSelectedLabelId(null); setView("list"); setIsSidebarOpen(false); }}
          selectedLabelId={selectedLabelId}
          setSelectedLabelId={(id) => { setSelectedLabelId(id); setSelectedListId(null); setView("list"); setIsSidebarOpen(false); }}
          onCreateList={handleCreateList}
          onCreateLabel={handleCreateLabel}
        />
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card/80 backdrop-blur-md border border-border shadow-lg hover:bg-card transition-all"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-foreground" />
        </button>

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
                tasks={filteredTasks}
                lists={lists}
                activityLogs={activityLogs}
                onAddTaskClick={openCreateModal}
                onTaskClick={handleTaskClick}
              />
            )}

            {currentView === "kanban" && (
              <KanbanView
                tasks={filteredTasks}
                lists={lists}
                labels={labels}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskDelete={requestDelete}
                onTaskClick={handleTaskClick}
                onAddTask={(title, status) => {
                  setTaskTitle(title);
                  setTaskStatus(status as Task["status"]);
                  setModalMode("create");
                  setIsModalOpen(true);
                }}
              />
            )}

            {currentView === "list" && (
              <ListView
                tasks={filteredTasks}
                lists={lists}
                labels={labels}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskDelete={requestDelete}
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
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        isSubmitting={isSubmitting}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDesc={taskDesc}
        setTaskDesc={setTaskDesc}
        taskDueDate={taskDueDate}
        setTaskDueDate={setTaskDueDate}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskStatus={taskStatus}
        setTaskStatus={setTaskStatus}
        taskListId={taskListId}
        setTaskListId={setTaskListId}
        taskLabelsSelected={taskLabelsSelected}
        setTaskLabelsSelected={setTaskLabelsSelected}
        newSubtaskTitle={newSubtaskTitle}
        setNewSubtaskTitle={setNewSubtaskTitle}
        subtasksChecklist={subtasksChecklist}
        onSubmit={handleTaskSubmit}
        onAddSubtask={handleAddSubtask}
        onRemoveSubtask={handleRemoveSubtask}
        lists={lists}
        labels={labels}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete Task"
      />

    </div>
  );
}
