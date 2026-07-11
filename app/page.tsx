"use client";

import React, { useEffect, useMemo, useRef } from "react";
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
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { ShortcutsModal } from "@/src/components/ShortcutsModal";
import { DashboardSkeleton, KanbanSkeleton, ListSkeleton, StatsSkeleton } from "@/src/components/Skeleton";
import { useTaskPlanner } from "@/src/lib/hooks/useTaskPlanner";
import { useTaskTemplates } from "@/src/lib/hooks/useTemplates";
import ConfettiCanvas from "@/src/components/ConfettiCanvas";
import FocusView from "@/src/components/FocusView";
import CalendarView from "@/src/components/CalendarView";
import StatsView from "@/src/components/StatsView";
import { writeUrlState, readUrlParam } from "@/src/lib/hooks/useUrlState";

const DashboardView = dynamic(() => import("@/src/components/DashboardView"));
const KanbanView = dynamic(() => import("@/src/components/KanbanView"));
const ListView = dynamic(() => import("@/src/components/ListView"));
const EisenhowerView = dynamic(() => import("@/src/components/EisenhowerView"));

type ViewName = "dashboard" | "kanban" | "list" | "eisenhower" | "calendar" | "stats";

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
    setModalMode,
    currentEditingTask,
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
    dueDateScope,
    setDueDateScope,
    isZenMode,
    setIsZenMode,
    selectedFilter,
    setSelectedFilter,
    savedFilters,
    shortcutConfigs,
    openFocusMode,
    closeFocusMode,
    handleFocusSessionComplete,
    openCreateModal,
    handleTaskSubmit,
    handleTaskUpdateDirect,
    handleTaskDuplicate,
    reorderTasks,
    requestDelete,
    confirmDelete,
    handleClearCompleted,
    handleClearLogs,
    handleCreateList,
    handleCreateLabel,
    handleSaveFilter,
    handleDeleteFilter,
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

  // Templates: list, save current task as template, spawn from template.
  const templatesApi = useTaskTemplates();

  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  // Load templates on mount so CommandPalette's "Task Templates" section
  // is populated by the time the user opens it.
  useEffect(() => {
    templatesApi.loadTemplates();
  }, [templatesApi.loadTemplates]);

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

      if (isInputFocused) return;

      // Find matching shortcut config
      const config = shortcutConfigs.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const metaMatch = !!s.metaKey === (e.metaKey || e.ctrlKey);
        const shiftMatch = !!s.shiftKey === e.shiftKey;
        const altMatch = !!s.altKey === e.altKey;
        return keyMatch && metaMatch && shiftMatch && altMatch;
      });

      if (config) {
        e.preventDefault();
        
        // Action Mapping
        if (config.action === "openCreateModal") openCreateModal();
        else if (config.action === "transitionView:dashboard") transitionView("dashboard");
        else if (config.action === "transitionView:kanban") transitionView("kanban");
        else if (config.action === "transitionView:list") transitionView("list");
        else if (config.action === "transitionView:eisenhower") transitionView("eisenhower");
        else if (config.action === "toggleCommandPalette") setIsCommandPaletteOpen(prev => !prev);
        else if (config.action === "openSettings") setIsSettingsOpen(true);
        else if (config.action === "showShortcuts") setIsShortcutsOpen(true);
        else if (config.action === "focusSearch") {
          const searchInput = document.getElementById(
            currentView === "kanban" ? "kanban-search" : "list-search"
          );
          if (searchInput) searchInput.focus();
        }
        else if (config.action === "closeActiveModal") {
          setIsModalOpen(false);
          setIsCommandPaletteOpen(false);
          setIsSettingsOpen(false);
          setIsShortcutsOpen(false);
        }
        return;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    shortcutConfigs, 
    isModalOpen, 
    isCommandPaletteOpen, 
    isSettingsOpen, 
    isShortcutsOpen, 
    openCreateModal, 
    transitionView, 
    setIsCommandPaletteOpen, 
    setIsSettingsOpen, 
    currentView,
    setIsModalOpen,
    setIsShortcutsOpen
  ]);

  // Filter tasks in view by selected Sidebar options, date scope, AND
  // exclude isTemplate: true tasks so they don't pollute active views.
  const activeTasks = useMemo(() => tasks.filter((t) => !t.isTemplate), [tasks]);
  const filteredActiveTasks = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endToday = new Date(startToday.getTime() + 86_400_000 - 1);
    const endWeek = new Date(startToday.getTime() + 7 * 86_400_000 - 1);
    return activeTasks.filter(t => {
      if (selectedListId && t.listId !== selectedListId) return false;
      if (selectedLabelId && !t.labels?.includes(selectedLabelId)) return false;
      if (dueDateScope && t.dueDate) {
        const due = new Date(t.dueDate).getTime();
        if (dueDateScope === "today" && (due < startToday.getTime() || due > endToday.getTime())) return false;
        if (dueDateScope === "overdue" && (due >= startToday.getTime() || t.status === "completed" || t.status === "done" || t.status === "archived")) return false;
        if (dueDateScope === "week" && (due < startToday.getTime() || due > endWeek.getTime())) return false;
      } else if (dueDateScope && !t.dueDate) {
        return false;
      }
      return true;
    });
  }, [activeTasks, selectedListId, selectedLabelId, dueDateScope]);
  // Single source of truth: filteredTasks now uses filteredActiveTasks so templates never appear in main views.
  const filteredTasks = filteredActiveTasks;

  return (
    <div className={`flex bg-background text-foreground min-h-screen relative overflow-hidden font-sans antialiased ${isZenMode ? "zen-mode" : ""}`}>

      <ErrorBoundary
        label="Workspace"
        onGoHome={() => transitionView("dashboard")}
      >
      
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
          dueDateScope={dueDateScope}
          setDueDateScope={(s) => {
            setDueDateScope(s);
            if (s) {
              // scope is global, so clear per-list / per-label / saved-filter contexts
              setSelectedListId(null);
              setSelectedLabelId(null);
              setSelectedFilter(null);
              transitionView("list");
            }
          }}
          lists={lists}
          labels={labels}
          tasks={tasks}
          activityLogs={activityLogs}
          templates={templatesApi.templates}
          onCreateFromTemplate={async (templateId) => {
            await templatesApi.createFromTemplate(templateId);
            await refreshData();
          }}
          onDeleteTemplate={templatesApi.deleteTemplate}
          savedFilters={savedFilters}
          selectedListId={selectedListId}
          setSelectedListId={(id) => { setSelectedListId(id); setSelectedLabelId(null); setSelectedFilter(null); transitionView("list"); setIsSidebarOpen(false); }}
          selectedLabelId={selectedLabelId}
          setSelectedLabelId={(id) => { setSelectedLabelId(id); setSelectedListId(null); setSelectedFilter(null); transitionView("list"); setIsSidebarOpen(false); }}
          selectedFilter={selectedFilter}
          setSelectedFilter={(filter) => { setSelectedFilter(filter); setSelectedListId(null); setSelectedLabelId(null); transitionView("list"); setIsSidebarOpen(false); }}
          onDeleteFilter={handleDeleteFilter}
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
          currentView === "stats" ? <StatsSkeleton /> :
          <ListSkeleton />
        ) : (
          <>
            {currentView === "dashboard" && (
              <ErrorBoundary
                label="Dashboard Overview"
                onGoHome={() => transitionView("dashboard")}
              >
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
              </ErrorBoundary>
            
            )}

            {currentView === "kanban" && (
              <ErrorBoundary
                label="Kanban Board"
                onGoHome={() => transitionView("dashboard")}
              >
                <KanbanView
                tasks={filteredTasks}
                lists={lists}
                labels={labels}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskDelete={requestDelete}
                onTaskClick={handleTaskClick}
                onAddTask={handleKanbanAddTask}
                onTaskDuplicate={handleTaskDuplicate}
                onReorderTasks={reorderTasks}
                selectedListId={selectedListId}
                selectedLabelId={selectedLabelId}
                selectedFilter={selectedFilter}
                onSaveFilter={handleSaveFilter}
                onFocusTask={openFocusMode}
              />
              </ErrorBoundary>
            
            )}

            {currentView === "list" && (
              <ErrorBoundary
                label="Task List"
                onGoHome={() => transitionView("dashboard")}
              >
                <ListView
                tasks={filteredTasks}
                lists={lists}
                labels={labels}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskDelete={requestDelete}
                onTaskClick={handleTaskClick}
                selectedListId={selectedListId}
                selectedLabelId={selectedLabelId}
                selectedFilter={selectedFilter}
                onSaveFilter={handleSaveFilter}
                onTaskDuplicate={handleTaskDuplicate}
                onClearCompleted={handleClearCompleted}
                onFocusTask={openFocusMode}
              />
              </ErrorBoundary>
            
            )}

            {currentView === "eisenhower" && (
              <ErrorBoundary
                label="Eisenhower Matrix"
                onGoHome={() => transitionView("dashboard")}
              >
                <EisenhowerView
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdateDirect}
                onTaskClick={handleTaskClick}
                onFocusTask={openFocusMode}
                onTaskDelete={requestDelete}
              />
              </ErrorBoundary>
            
            )}

            {currentView === "calendar" && (
              <ErrorBoundary
                label="Calendar"
                onGoHome={() => transitionView("dashboard")}
              >
                <CalendarView
                tasks={filteredTasks}
                lists={lists}
                labels={labels}
                onTaskClick={handleTaskClick}
                onAddTask={(title, dueDate) => {
                  // Use the canonical open-create path so empty title doesn't silently no-op.
                  openCreateModal();
                  // Override the due date with the clicked-on date.
                  if (dueDate) setTaskDueDate(dueDate.split("T")[0]);
                  if (title) setTaskTitle(title);
                }}
              />
              </ErrorBoundary>
            
            )}

            {currentView === "stats" && (
              <ErrorBoundary
                label="Statistics"
                onGoHome={() => transitionView("dashboard")}
              >
                <StatsView tasks={filteredTasks} lists={lists} labels={labels} />
              </ErrorBoundary>
            
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
          onPomodoroComplete={(durationSeconds, completedEarly) =>
            focusTaskId != null && handleFocusSessionComplete(focusTaskId, durationSeconds, completedEarly)
          }
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
        tasks={activeTasks}
        setView={transitionView}
        onCreateTask={handleCreateTaskFromCommand}
        onSelectTask={handleTaskClick}
        setThemeMode={updateTheme}
        setAccentColor={setAccentColor}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        templates={templatesApi.templates}
        onCreateFromTemplate={async (templateId) => {
          await templatesApi.createFromTemplate(templateId);
          await refreshData();
        }}
      />

      {/* Task Creation & Modification Glass Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        isSubmitting={isSubmitting}
        isTemplate={currentEditingTask?.isTemplate === true}
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
        onSaveAsTemplate={(t) => templatesApi.saveAsTemplate(t)}
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
        shortcutConfigs={shortcutConfigs}
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

      </ErrorBoundary>
    </div>
  );
}
