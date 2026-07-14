"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types";

interface VoiceCommand {
  command: string;
  pattern: RegExp;
  action: (match: RegExpMatchArray) => Promise<void>;
  description: string;
}

interface VoiceCommandResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  commands: VoiceCommand[];
}

// Check for browser speech recognition support
const isSpeechRecognitionSupported = typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function useVoiceCommands(
  tasks: Task[],
  onAddTask: (title: string, status: string) => void,
  onCompleteTask: (id: number) => void,
  onDeleteTask: (id: number) => void
): VoiceCommandResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SpeechRecognition();

    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const text = result[0].transcript.toLowerCase();
      setTranscript(text);

      // Process commands
      processCommand(text);
    };

    recog.onerror = (event: any) => {
      setError(`Voice recognition error: ${event.error}`);
      setIsListening(false);
    };

    setRecognition(recog);
  }, [tasks, onAddTask, onCompleteTask, onDeleteTask]);

  const processCommand = useCallback((text: string) => {
    // Task creation patterns
    const createMatch = text.match(/add (task|to do|todo) (?:called? ?)?["']?([^"']+)["']?/i);
    if (createMatch) {
      onAddTask(createMatch[2], "pending");
      setTranscript("");
      return;
    }

    // "Remind me tomorrow" pattern
    const remindMatch = text.match(/remind me (?:tomorrow|next week)/i);
    if (remindMatch) {
      const days = remindMatch[0].includes("tomorrow") ? 1 : 7;
      // This would integrate with task due date setting
      setTranscript("");
      return;
    }

    // "Show me [view]" pattern
    const viewMatch = text.match(/show (?:me )?(dashboard|kanban|list|calendar)/i);
    if (viewMatch) {
      // Would integrate with view navigation
      setTranscript("");
      return;
    }

    // "What's my biggest priority" pattern
    const priorityMatch = /what's my biggest priority|what is my biggest priority/i.test(text);
    if (priorityMatch) {
      const highPriority = tasks.find(t => t.priority === "high");
      if (highPriority) {
        setTranscript(`Your biggest priority is: ${highPriority.title}`);
      }
      return;
    }
  }, [tasks, onAddTask]);

  const startListening = useCallback(() => {
    if (!recognition) {
      setError("Voice recognition not supported in this browser");
      return;
    }
    setError(null);
    setTranscript("");
    recognition.start();
    setIsListening(true);
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  }, [recognition]);

  const commands: VoiceCommand[] = [
    {
      command: "add [task] [title]",
      pattern: /add (?:task )?(.+)/i,
      action: async (match) => onAddTask(match[1], "pending"),
      description: "Create a new task",
    },
    {
      command: "remind me tomorrow",
      pattern: /remind me tomorrow/i,
      action: async () => {},
      description: "Set due date to tomorrow",
    },
    {
      command: "what's my biggest priority",
      pattern: /what's my biggest priority/i,
      action: async () => {},
      description: "Show your highest priority task",
    },
    {
      command: "show me [view]",
      pattern: /show me (dashboard|kanban|list|calendar)/i,
      action: async () => {},
      description: "Navigate to a view",
    },
  ];

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    commands,
  };
}