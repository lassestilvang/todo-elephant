"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task } from "@/types";
import { aiAssistant } from "@/lib/ai/assistant";

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
  confidence: number;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  clearTranscript: () => void;
  commands: VoiceCommand[];
}

// Check for browser speech recognition support
const isSpeechRecognitionSupported = typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

export function useVoiceCommands(
  tasks: Task[],
  onAddTask: (title: string, status: string) => void,
  onCompleteTask: (id: number) => void,
  onDeleteTask: (id: number) => void,
  onNavigate?: (view: string) => void
): VoiceCommandResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if supported
    setIsSupported(isSpeechRecognitionSupported);

    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    recog.maxAlternatives = 5;

    recog.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const conf = result[0].confidence;

      setTranscript(transcript.toLowerCase());
      setConfidence(conf);

      if (result.isFinal) {
        processCommand(transcript.toLowerCase());
      }
    };

    recog.onerror = (event: any) => {
      setError(`Voice recognition error: ${event.error}`);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;
  }, [tasks, onAddTask, onCompleteTask, onDeleteTask]);

  // Process voice commands
  const processCommand = useCallback(async (text: string) => {
    try {
      // Task creation patterns
      const createMatch = text.match(/add (?:task|to do|todo) (?:called? ?)?["']?([^"']+)["']?/i);
      if (createMatch) {
        onAddTask(createMatch[1].trim(), "pending");
        setTranscript("");
        return;
      }

      // Quick add (just a title)
      if (text.length > 3 && !text.includes('add') && !text.includes('show') && !text.includes('what')) {
        // Use AI assistant to parse
        const result = await aiAssistant.processNaturalLanguage(text);
        onAddTask(result.title, "pending");
        setTranscript("");
        return;
      }

      // "Remind me tomorrow" pattern
      const remindMatch = text.match(/remind me (?:tomorrow|next week)/i);
      if (remindMatch) {
        setTranscript("");
        return;
      }

      // "Show me [view]" pattern
      if (onNavigate) {
        const viewMatch = text.match(/show (?:me )?(dashboard|kanban|list|calendar|stats|forest|habit|history)/i);
        if (viewMatch) {
          onNavigate(viewMatch[1]);
          setTranscript("");
          return;
        }
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

      // "What did I complete today" pattern
      const completedMatch = /what did i (complete|finish|accomplish)/i.test(text);
      if (completedMatch) {
        const todayCompleted = tasks.filter(t =>
          t.status === "completed" || t.status === "done" || t.status === "done"
        );
        if (todayCompleted.length > 0) {
          setTranscript(`You completed ${todayCompleted.length} task${todayCompleted.length > 1 ? 's' : ''} today`);
        }
        return;
      }

      // Help command
      const helpMatch = /help|what can i (say|do)/i.test(text);
      if (helpMatch) {
        setTranscript("Todo Elephant Voice Commands: 'Add task [title]', 'Show dashboard', 'Show kanban', 'Show calendar', 'What's my priority', 'Help'");
        return;
      }

    } catch (error) {
      console.error("Voice command error:", error);
    }
  }, [tasks, onAddTask, onNavigate]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError("Voice recognition not supported in this browser");
      return;
    }
    setError(null);
    setTranscript("");
    setConfidence(0);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      setError("Failed to start voice recognition");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setConfidence(0);
  }, []);

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
      action: async (match) => onNavigate?.(match[1]),
      description: "Navigate to a view",
    },
  ];

  return {
    isListening,
    transcript,
    error,
    confidence,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    commands,
  };
}