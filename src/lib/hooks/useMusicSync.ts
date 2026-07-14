// src/lib/hooks/useMusicSync.ts
import { useEffect, useRef } from 'react';
import { Task } from '@/types';

// Simple audio context wrapper
class AudioEngine {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor() {
    this.initAudio();
  }

  private initAudio = () => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    }
  };

  private createOscillator = (frequency: number, duration: number) => {
    if (!this.audioContext) return;

    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.oscillator.start();
    this.oscillator.stop(this.audioContext.currentTime + duration);
  };

  private playAmbient = (duration: number) => {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();

    this.currentBuffer = buffer;
  };

  public playTaskSound = (status: Task['status'], focusMode: boolean) => {
    // Clean up any existing sound
    this.stopAllSounds();

    const now = this.audioContext.currentTime;

    // Different sounds based on task status and focus mode
    switch (status) {
      case 'completed':
        // Celebration chime
        this.playOscillator(880, 0.2); // A5 note
        this.playOscillator(1046, 0.1); // C6 note
        break;
      case 'in_progress':
        // Steady beat for active work
        this.playOscillator(440, 0.5); // A4 note
        break;
      case 'pending':
        // Soft bell for upcoming tasks
        this.playOscillator(523, 0.3); // C5 note
        break;
      default:
        // Ambient background when no specific status
        if (focusMode) {
          this.playAmbient(5); // 5 second ambient
        }
        break;
    }
  };

  public playOscillator = (frequency: number, duration: number) => {
    if (!this.oscillator) return;
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    this.oscillator.stop(this.audioContext.currentTime + duration);
  };

  public stopAllSounds = () => {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  };

  public dispose = () => {
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  };
}

// Music mode definitions
export type FocusMode = 'default' | 'pomodoro' | 'deep_work' | 'break';

export const useMusicSync = (taskStatus: Task['status'], focusMode: FocusMode) => {
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());

  useEffect(() => {
    // Listen for changes in task status or focus mode
    const handleStatusChange = (newStatus: Task['status']) => {
      audioEngineRef.current.playTaskSound(newStatus, focusMode === 'deep_work');
    };

    const handleFocusModeChange = (newMode: FocusMode) => {
      // Re-trigger sound based on current task status
      const currentTask = taskStatus; // Assuming taskStatus is available from context
      handleStatusChange(currentTask);
    };

    // Register listeners (implementation depends on your state management)
    // Example using a global event bus:
    const bus = new EventTarget();
    bus.addEventListener('task-status-change', handleStatusChange);
    bus.addEventListener('focus-mode-change', handleFocusModeChange);

    // Cleanup
    return () => {
      audioEngineRef.current.dispose();
      bus.removeEventListener('task-status-change', handleStatusChange);
      bus.removeEventListener('focus-mode-change', handleFocusModeChange);
    };
  }, [taskStatus, focusMode]);

  return {
    play: () => {
      // Public method to manually trigger sound
      const task = /* get current task */;
      audioEngineRef.current.playTaskSound(task?.status ?? 'pending', focusMode === 'deep_work');
    },
    stop: () => {
      audioEngineRef.current.stopAllSounds();
    },
    dispose: () => {
      audioEngineRef.current.dispose();
    }
  };
};

export default useMusicSync;