"use client";

import { useState, useCallback, useEffect } from "react";

// Type declarations for Web Speech API
type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList[];
  resultIndex: number;
};

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult;
  length: number;
  isFinal: boolean;
};

type SpeechRecognitionResult = {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message: string;
};

interface SpeechRecognitionEventWithResults extends Event {
  results: SpeechRecognitionResultList[];
  resultIndex: number;
}

interface SpeechRecognitionErrorEventWithMessage extends Event {
  error: string;
  message: string;
}

type SpeechRecognitionConstructor = {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEventWithResults) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEventWithMessage) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceCaptureState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

/**
 * Voice task capture hook using Web Speech API.
 * Supports browsers with SpeechRecognition (Chrome/Chromium).
 */
export function useVoiceCapture() {
  const [state, setState] = useState<VoiceCaptureState>({
    isListening: false,
    transcript: "",
    error: null,
  });

  // Check for SpeechRecognition support
  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setState(s => ({ ...s, error: "Speech recognition not supported in this browser" }));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new (SpeechRecognition as SpeechRecognitionConstructor)();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from((event as SpeechRecognitionEventWithResults).results)
        .map((r: any) => r[0]?.transcript || "")
        .join("");
      setState(s => ({ ...s, transcript }));
    };

    recognition.onerror = (event) => {
      setState(s => ({ ...s, error: (event as SpeechRecognitionErrorEventWithMessage).error, isListening: false }));
    };

    recognition.onend = () => {
      setState(s => ({ ...s, isListening: false }));
    };

    setState(s => ({ ...s, isListening: true, error: null }));
    recognition.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    setState(s => ({ ...s, isListening: false }));
  }, []);

  const resetTranscript = useCallback(() => {
    setState(s => ({ ...s, transcript: "", error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recognition
      if (state.isListening) {
        stopListening();
      }
    };
  }, [state.isListening, stopListening]);

  return {
    isListening: state.isListening,
    transcript: state.transcript,
    error: state.error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}