"use client";

import React, { useEffect, useMemo } from "react";
import { Toaster } from "sonner";
import { 
  Keyboard,
  Menu,
} from "lucide-react";
import dynamic from "next/dynamic";
import Sidebar from "@/src/components/Sidebar";
import CommandPalette from "@/src/components/CommandPalette";
import TaskModal from "@/src/components/TaskModal";
import SettingsModal from "@/src/components/SettingsModal";
import ConfirmDialog from "@/src/components/ConfirmDialog";
import { ShortcutsModal } from "@/src/components/ShortcutsModal";
import { DashboardSkeleton, KanbanSkeleton, ListSkeleton } from "@/src/components/Skeleton";
import { useTaskPlanner } from "@/src/lib/hooks/useTaskPlanner";
import ConfettiCanvas from "@/src/components/ConfettiCanvas";
import FocusView from "@/src/components/FocusView";

const DashboardView = dynamic(() => import("@/src/components/DashboardView"));
const KanbanView = dynamic(() => import("@/src/components/KanbanView"));
const ListView = dynamic(() => import("@/src/components/ListView"));
const EisenhowerView = dynamic(() => import("@/src/components/EisenhowerView"));

export default function Home() {
  const {
    currentView,
    selectedListId,
    setSelectedListId,
    selectedLabelId,
    setSelectedLabelId,
    tasks,
    lists,
    labels,
    activityLogs,
    loading,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    taskTitle,
    setTaskTitle,
    taskDesc,
    setTaskDesc,
    taskDueDate,
    setTaskDueDate,
    taskPriority,
    setTaskPriority,
    taskStatus,
    setTaskStatus,
    taskListId,
    setTaskListId,
    taskLabelsSelected,
    setTaskLabelsSelected,
    taskDependsOn,
    setTaskDependsOn,
    taskIsImportant,
    setTaskIsImportant,
    taskIsUrgent,
    setTaskIsUrgent,
    taskRecurrence,
    setTaskRecurrence,
    newSubtaskTitle,
    setNewSubtaskTitle,
    subtasksChecklist,
    isSubmitting,
    pendingDeleteId,
    setPendingDeleteId,
    isSidebarOpen,
    setIsSidebarOpen,
    accentColor,
    setAccentColor,
    isSettingsOpen,
    setIsSettingsOpen,
    isFocusModeOpen,
    setIsFocusModeOpen,
    focusTaskId,
    isZenMode,
    setIsZenMode,
    openFocusMode,
    closeFocusMode,
    openCreateModal,
    handleTaskSubmit,
    handleTaskUpdateDirect,
    handleTaskDuplicate,
    requestDelete,
    confirmDelete,
    handleClearCompleted,
    handleClearLogs,
    handleCreateList,
    handleCreateLabel,
    handleTaskClick,
    handleKanbanAddTask,
    handleCreateTaskFromCommand,
    handleQuickAdd,
    handleAddSubtask,
    handleRemoveSubtask,
    handleToggleSubtask,
    handleMagicBreakdown,
    transitionView,
    soundEnabled,
    setSoundEnabled,
    refreshData,
    themeMode,
    updateTheme
  } = useTaskPlanner();

  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  // Apply accent color on load
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-light", accentColor);
    root.style.setProperty("--accent-dark", accentColor);
    root.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (isInputFocused || isModalOpen || isCommandPaletteOpen || isSettingsOpen || isShortcutsOpen) return;

      switch (e.key) {
        case "n":
          e.preventDefault();
          openCreateModal();
          break;
        case "1":
          e.preventDefault();
          transitionView("dashboard");
          break;
        case "2":
          e.preventDefault();
          transitionView("kanban");
          break;
        case "3":
          e.preventDefault();
          transitionView("list");
          break;
        case "?":
          e.preventDefault();
          setIsShortcutsOpen(true);
          break;
        case "/":
          e.preventDefault();
          const searchInput = document.getElementById(
            currentView === "kanban" ? "kanban-search" : "list-search"
          );
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case ",":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsSettingsOpen(true);
          }
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isCommandPaletteOpen, isSettingsOpen, isShortcutsOpen, openCreateModal, transitionView, setIsCommandPaletteOpen, setIsSettingsOpen, currentView]);

  // Filter tasks in view by selected Sidebar options
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedListId) return t.listId === selectedListId;
      if (selectedLabelId) return t.labels?.includes(selectedLabelId);
      return true;
    });
  }, [tasks, selectedListId, selectedLabelId]);

  return (
    <div className={`flex bg-background text-foreground min-h-screen relative overflow-hidden font-sans antialiased ${isZenMode ? "zen-mode" : ""}`}>
      
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
      <div className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${isZenMode ? "md:hidden" : "md:relative"} fixed z-40 transition-transform duration-300 ease-in-out`}>
        <Sidebar
          currentView={currentView}
          setView={(v) => { transitionView(v); setIsSidebarOpen(false); }}
          lists={lists}
          labels={labels}
          tasks={tasks}
          savedFilters={savedFilters}
          selectedListId={selectedListId}
          setSelectedListId={(id) => { setSelectedListId(id); setSelectedLabelId(null); setSelectedFilter(null); transitionView("list"); setIsSidebarOpen(false); }}
          selectedLabelId={selectedLabelId}
          setSelectedLabelId={(id) => { setSelectedLabelId(id); setSelectedListId(null); setSelectedFilter(null); transitionView("list"); setIsSidebarOpen(false); }}
          selectedFilter={selectedFilter}
          setSelectedFilter={(filter) => { setSelectedFilter(filter); setSelectedListId(null); setSelectedLabelId(null); transitionView("list"); setIsSidebarOpen(false); }}
          onCreateList={handleCreateList}
          onCreateLabel={handleCreateLabel}
          onOpenSettings={() => setIsSettingsOpen(true)}
          themeMode={themeMode}
          updateTheme={updateTheme}
          isZenMode={isZenMode}
          setIsZenMode={setIsZenMode}
        />
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`${isZenMode ? "hidden" : "md:hidden"} fixed top-4 left-4 z-50 p-2 rounded-xl bg-card/80 backdrop-blur-md border border-border shadow-lg hover:bg-card transition-all`}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} className="text-foreground" />
        </button>

        {/* Floating Quick Keyboard Shortcuts Banner */}
        <div className={`absolute top-4 right-4 z-20 ${isZenMode ? "hidden" : "hidden md:flex"} items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-md border border-border text-[10px] text-muted font-bold tracking-tight select-none`}>
          <Keyboard size={12} />
          <span className="px-1 py-0.5 bg-muted/15 border border-border/40 rounded shadow-sm">n</span>
          <span>new</span>
          <span className="px-1 py-0.5 bg-muted/15 border border-border/40 rounded shadow-sm">1-3</span>
          <span>views</span>
          <span className="px-1 py-0.5 bg-muted/15 border border-border/40 rounded shadow-sm">⌘K</span>
          <span>cmd</span>
        </div>

        {/* View Switch Router */}
        {loading ? (
          currentView === "dashboard" ? <DashboardSkeleton /> :
          currentView === "kanban" ? <KanbanSkeleton /> :
          <ListSkeleton />
        ) : (
          <>
            {currentView === "dashboard" && (
              <DashboardView
                tasks={filteredTasks}
                lists={lists}
                activityLogs={activityLogs}
                onAddTaskClick={openCreateModal}
                onTaskClick={handleTaskClick}
                onQuickAdd={handleQuickAdd}
                onClearLogs={handleClearLogs}
                onTaskUpdate={handleTaskUpdateDirect}
                onFocusTask={openFocusMode}
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
                onAddTask={handleKanbanAddTask}
                onTaskDuplicate={handleTaskDuplicate}
                selectedListId={selectedListId}
                selectedLabelId={selectedLabelId}
                onFocusTask={openFocusMode}
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
                selectedListId={selectedListId}
                selectedLabelId={selectedLabelId}
                onTaskDuplicate={handleTaskDuplicate}
                onClearCompleted={handleClearCompleted}
                onFocusTask={openFocusMode}
              />
            )}

            {currentView === "eisenhower" && (
              <EisenhowerView
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskClick={handleTaskClick}
                onFocusTask={openFocusMode}
                onTaskDelete={requestDelete}
              />
            )}
          </>
        )}

      </main>

      {/* Focus Mode Overlay */}
      {isFocusModeOpen && focusTaskId && tasks.find(t => t.id === focusTaskId) && (
        <FocusView
          task={tasks.find(t => t.id === focusTaskId)!}
          onClose={closeFocusMode}
          onTaskUpdate={handleTaskUpdateDirect}
        />
      )}

      {/* Zen Mode Exit Button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="fixed bottom-8 right-8 z-[60] flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all animate-bounce"
        >
          <span>Exit Zen Mode</span>
        </button>
      )}

      {/* Global Interactive Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        setView={transitionView}
        onCreateTask={handleCreateTaskFromCommand}
        onSelectTask={handleTaskClick}
        setThemeMode={updateTheme}
        setAccentColor={setAccentColor}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
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
        taskDependsOn={taskDependsOn}
        setTaskDependsOn={setTaskDependsOn}
        taskIsImportant={taskIsImportant}
        setTaskIsImportant={setTaskIsImportant}
        taskIsUrgent={taskIsUrgent}
        setTaskIsUrgent={setTaskIsUrgent}
        taskRecurrence={taskRecurrence}
        setTaskRecurrence={setTaskRecurrence}
        newSubtaskTitle={newSubtaskTitle}
        setNewSubtaskTitle={setNewSubtaskTitle}
        subtasksChecklist={subtasksChecklist}
        onSubmit={handleTaskSubmit}
        onAddSubtask={handleAddSubtask}
        onRemoveSubtask={handleRemoveSubtask}
        onToggleSubtask={handleToggleSubtask}
        onMagicBreakdown={handleMagicBreakdown}
        lists={lists}
        labels={labels}
        tasks={tasks}
      />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        refreshData={refreshData}
        themeMode={themeMode}
        setThemeMode={updateTheme}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
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

      {/* Confetti canvas animation overlay */}
      <ConfettiCanvas />

    </div>
  );
}
