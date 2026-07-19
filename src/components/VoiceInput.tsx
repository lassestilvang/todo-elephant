"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Task } from "@/types";

interface VoiceInputProps {
  onAddTask: (task: Partial<Task>) => void;
  onClose?: () => void;
  isOpen: boolean;
}

interface VoiceCommand {
  type: "task" | "reminder" | "label";
  text: string;
  extracted?: {
    title?: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
    list?: string;
    labels?: string[];
  };
}

export function VoiceInput({ onAddTask, onClose, isOpen }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser compatibility
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      setError("Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }
      // Update with final results only (interim results flicker)
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      let errorMsg = "Voice input error: ";
      switch (event.error) {
        case "no-speech":
          errorMsg += "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMsg += "Microphone not accessible. Check permissions.";
          break;
        case "not-allowed":
          errorMsg += "Microphone permission denied. Enable in browser settings.";
          break;
        case "network":
          errorMsg += "Network error. Check your connection.";
          break;
        default:
          errorMsg += event.error;
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const msg = "Speech recognition is not supported in your browser. Try Chrome, Edge, or Safari.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... Speak now");
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setError("Failed to start voice recognition");
        toast.error("Failed to start voice recognition");
      }
    }
  };

  const parseVoiceCommand = (text: string): VoiceCommand => {
    const command: VoiceCommand = {
      type: "task",
      text,
      extracted: {},
    };

    // Extract priority
    if (/(?:urgent|asap|important|critical)/i.test(text)) {
      command.extracted!.priority = "high";
    } else if (/(?:later|low|eventually)/i.test(text)) {
      command.extracted!.priority = "low";
    }

    // Extract due dates - improved regex
    const datePattern = /(?:on|by|due)?\s*(tomorrow|today|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+|in\s+\d+\s*(?:day|days|week|weeks|month|months))/i;
    const dateMatches = text.match(datePattern);
    if (dateMatches) {
      command.extracted!.dueDate = parseRelativeDate(dateMatches[0]); // Use full match
    }

    // Extract labels
    const labelMatches = text.match(/#(\w+)/g);
    if (labelMatches) {
      command.extracted!.labels = labelMatches.map((l) => l.slice(1));
    }

    // Extract title by removing commands
    let title = text
      .replace(/remind\s+me\s+to/i, "")
      .replace(/please\s+add/i, "")
      .replace(/(urgent|asap|important|critical|later|low|eventually)/gi, "")
      .replace(/(on|by|due)/i, "")
      .replace(datePattern, "") // Remove the date pattern
      .replace(/#(\w+)/g, "")
      .trim();

    command.extracted!.title = title || text;

    return command;
  };

  const parseRelativeDate = (text: string): string => {
    const today = new Date();
    const dateStr = text.toLowerCase();

    if (dateStr.includes("today")) return today.toISOString().split("T")[0];
    if (dateStr.includes("tomorrow")) {
      today.setDate(today.getDate() + 1);
      return today.toISOString().split("T")[0];
    }
    if (dateStr.includes("next week")) {
      today.setDate(today.getDate() + 7);
      return today.toISOString().split("T")[0];
    }

    // Weekday mapping
    const dayMap: { [key: string]: number } = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };

    for (const [day, dayNum] of Object.entries(dayMap)) {
      if (dateStr.includes(day)) {
        const currentDay = today.getDay();
        let diff = dayNum - currentDay;
        if (diff <= 0) diff += 7;
        today.setDate(today.getDate() + diff);
        return today.toISOString().split("T")[0];
      }
    }

    // Handle "in X days"
    const inDaysMatch = dateStr.match(/in (\d+) (day|week|month)/);
    if (inDaysMatch) {
      const num = parseInt(inDaysMatch[1]);
      const unit = inDaysMatch[2];
      if (unit === "day") today.setDate(today.getDate() + num);
      if (unit === "week") today.setDate(today.getDate() + num * 7);
      if (unit === "month") today.setMonth(today.getMonth() + num);
      return today.toISOString().split("T")[0];
    }

    return "";
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const command = parseVoiceCommand(transcript);
      onAddTask({
        title: command.extracted?.title || transcript,
        priority: command.extracted?.priority,
        dueDate: command.extracted?.dueDate,
        labels: command.extracted?.labels,
      });
      setTranscript("");
      setIsProcessing(false);
      toast.success("Task added from voice command");
      if (onClose) onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 max-w-md">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="rounded-2xl border border-border bg-card/95 shadow-2xl glass-panel animate-fade-in-scale">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Mic size={16} className="text-accent" />
            Voice Task Input
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Listening area */}
        <div className="p-4">
          <div
            onClick={toggleListening}
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isListening
                ? "border-red-500 bg-red-500/10 animate-pulse"
                : "border-border hover:border-accent hover:bg-accent/5"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              {isListening ? (
                <MicOff size={24} className="text-red-500" />
              ) : (
                <Mic size={24} className="text-accent" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isListening ? "Listening..." : "Click to start recording"}
            </p>
            {isListening && (
              <div className="text-xs text-muted flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                Listening for your task
              </div>
            )}
          </div>

          {/* Transcript display */}
          {transcript && (
            <div className="mt-4">
              <div className="text-xs text-muted mb-2">Heard:</div>
              <div className="p-3 rounded-xl bg-muted/5 border border-border text-sm">
                {transcript}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!transcript.trim() || isProcessing}
              className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send size={14} />
              )}
              {isProcessing ? "Processing..." : "Add Task"}
            </button>
            {transcript && (
              <button
                onClick={() => setTranscript("")}
                className="px-4 py-2 rounded-xl border border-border text-muted hover:text-foreground transition-colors"
              >
                <AlertCircle size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="px-4 py-3 bg-muted/5 border-t border-border text-xs text-muted">
          <p className="mb-1 font-medium">Say things like:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>"Remind me to call Sarah tomorrow"</li>
            <li>"Add urgent task: prepare presentation by Friday"</li>
            <li>"Buy groceries #errands in 2 days"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function useVoiceInput() {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");

  const open = () => setIsOpen(true);
  const close = () => {
    setTranscript("");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘ + Shift + V to open voice input
      if (e.metaKey && e.shiftKey && e.key === "v") {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return { isOpen, open, close, setTranscript, transcript };
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
