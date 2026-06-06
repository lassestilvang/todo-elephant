"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ChevronLeft,
  Timer,
  Maximize2,
  Minimize2,
  Bell
} from "lucide-react";
import { Task } from "@/types";
import { toast } from "sonner";

interface FocusViewProps {
  task: Task;
  onClose: () => void;
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
}

export default function FocusView({ task, onClose, onTaskUpdate }: FocusViewProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      toast.success("Time's up! Take a break or continue focusing.");
      // Play a small notification sound if possible
      if (typeof window !== "undefined") {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const handleToggleSubtask = (subId: number) => {
    const updatedSubtasks = subtasks.map(s => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    onTaskUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden animate-fade-in">
      
      {/* Top Navigation */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-xs">Exit Focus Mode</span>
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleFullScreen}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={onClose}
            className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-500 transition-all"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl w-full px-8 flex flex-col items-center space-y-12">
        
        {/* Task Identity */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              task.priority === "high" ? "bg-red-500/20 text-red-500" :
              task.priority === "medium" ? "bg-amber-500/20 text-amber-500" :
              "bg-blue-500/20 text-blue-500"
            }`}>
              {task.priority} Priority
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Focusing On</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight italic">
            {task.title}
          </h1>
          {task.description && (
            <p className="text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Timer Section */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-accent/20 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex flex-col items-center">
            <div className="text-8xl md:text-9xl font-black tabular-nums tracking-tight mb-8">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={resetTimer}
                className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                title="Reset Timer"
              >
                <RotateCcw size={24} />
              </button>
              
              <button 
                onClick={toggleTimer}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${
                  isActive ? "bg-white text-slate-950" : "bg-accent text-white"
                }`}
              >
                {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              
              <button 
                onClick={() => setTimeLeft(prev => prev + 5 * 60)}
                className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                title="Add 5 Minutes"
              >
                <span className="font-bold text-sm">+5</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subtasks Checklist */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Timer size={20} className="text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Milestones</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">{completedSubtasks} / {subtasks.length} Done</span>
          </div>

          {subtasks.length === 0 ? (
            <div className="py-8 text-center bg-white/5 rounded-3xl border border-white/5">
              <p className="text-slate-500 text-sm italic font-medium">Break this task into smaller steps in the main view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subtasks.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => handleToggleSubtask(sub.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    sub.completed 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 opacity-60" 
                      : "bg-white/5 border-white/5 hover:border-white/10 text-slate-200"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    sub.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                  }`}>
                    {sub.completed && <CheckCircle2 size={14} className="text-slate-950" />}
                  </div>
                  <span className={`text-sm font-bold truncate ${sub.completed ? "line-through" : ""}`}>
                    {sub.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Status Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {isActive ? "Deep Work Session" : "Paused"}
          </span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2 text-slate-400">
          <Bell size={12} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Alerts Enabled</span>
        </div>
      </div>

    </div>
  );
}
