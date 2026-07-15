"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task } from '@/types';

interface VRTaskPlacement {
  taskId: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  room: string;
}

interface VRRoom {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
  backgroundColor: string;
  lighting: 'warm' | 'cool' | 'neutral';
}

interface VRState {
  isVRSupported: boolean;
  isVRMode: boolean;
  currentRoom: string;
  placements: VRTaskPlacement[];
  enteredXR: boolean;
}

const DEFAULT_ROOMS: VRRoom[] = [
  {
    id: 'office',
    name: 'Office',
    description: 'Work-related tasks',
    position: { x: 0, y: 0, z: 0 },
    backgroundColor: '#1e293b',
    lighting: 'cool',
  },
  {
    id: 'gym',
    name: 'Gym',
    description: 'Health & fitness tasks',
    position: { x: 5, y: 0, z: 0 },
    backgroundColor: '#0f172a',
    lighting: 'warm',
  },
  {
    id: 'entry',
    name: 'Entry Hall',
    description: 'Inbox tasks',
    position: { x: -5, y: 0, z: 0 },
    backgroundColor: '#0c4a6e',
    lighting: 'neutral',
  },
  {
    id: 'store',
    name: 'Store',
    description: 'Shopping/errands',
    position: { x: 0, y: 0, z: 5 },
    backgroundColor: '#7c2d12',
    lighting: 'warm',
  },
  {
    id: 'library',
    name: 'Library',
    description: 'Learning & education',
    position: { x: 0, y: 0, z: -5 },
    backgroundColor: '#1e293b',
    lighting: 'cool',
  },
  {
    id: 'focus',
    name: 'Focus Room',
    description: 'High-priority tasks',
    position: { x: 2.5, y: 0, z: 2.5 },
    backgroundColor: '#1e3a8a',
    lighting: 'cool',
  },
];

export function useVRInterface(tasks: Task[]) {
  const [state, setState] = useState<VRState>({
    isVRSupported: false,
    isVRMode: false,
    currentRoom: 'office',
    placements: [],
    enteredXR: false,
  });

  const [rooms] = useState<VRRoom[]>(DEFAULT_ROOMS);
  const xrSessionRef = useRef<XRSession | null>(null);

  // Check VR/WebXR support
  useEffect(() => {
    const checkVRSupport = () => {
      if (typeof navigator === 'undefined') return false;
      return 'xr' in navigator && 'isSecureContext' in navigator;
    };

    setState(prev => ({ ...prev, isVRSupported: checkVRSupport() }));
  }, []);

  // Enter VR mode
  const enterVR = useCallback(async () => {
    if (!state.isVRSupported) return false;

    try {
      if (typeof navigator !== 'undefined' && 'xr' in navigator) {
        const xr = (navigator as any).xr;
        const session = await xr.requestSession('immersive-vr');
        xRSessionRef.current = session;
        setState(prev => ({ ...prev, isVRMode: true, enteredXR: true }));
        return true;
      }
    } catch (error) {
      console.error('Failed to enter VR:', error);
    }
    return false;
  }, [state.isVRSupported]);

  // Exit VR mode
  const exitVR = useCallback(() => {
    if (xRSessionRef.current) {
      xRSessionRef.current.end();
      xRSessionRef.current = null;
    }
    setState(prev => ({ ...prev, isVRMode: false }));
  }, []);

  // Switch room
  const switchRoom = useCallback((roomId: string) => {
    if (rooms.some(r => r.id === roomId)) {
      setState(prev => ({ ...prev, currentRoom: roomId }));
    }
  }, [rooms]);

  // Place task in VR space
  const placeTask = useCallback((taskId: number, position: { x: number; y: number; z: number }) => {
    setState(prev => {
      const existing = prev.placements.find(p => p.taskId === taskId);
      const newPlacements = existing
        ? prev.placements.map(p => p.taskId === taskId ? { ...p, position } : p)
        : [...prev.placements, {
            taskId,
            position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1,
            room: state.currentRoom,
          }];
      return { ...prev, placements: newPlacements };
    });
  }, [state.currentRoom]);

  // Remove task placement
  const removeTaskPlacement = useCallback((taskId: number) => {
    setState(prev => ({
      ...prev,
      placements: prev.placements.filter(p => p.taskId !== taskId),
    }));
  }, []);

  // Get placements for current room
  const getRoomPlacements = useCallback(() => {
    return state.placements.filter(p => p.room === state.currentRoom);
  }, [state.placements, state.currentRoom]);

  // Get task placement
  const getTaskPlacement = useCallback((taskId: number) => {
    return state.placements.find(p => p.taskId === taskId);
  }, [state.placements]);

  // Load placements from storage
  useEffect(() => {
    const stored = localStorage.getItem('todo-elephant-vr-placements');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(prev => ({ ...prev, placements: parsed }));
      } catch (e) {
        console.error('Failed to load VR placements:', e);
      }
    }
  }, []);

  // Save placements to storage
  useEffect(() => {
    if (state.placements.length > 0) {
      localStorage.setItem('todo-elephant-vr-placements', JSON.stringify(state.placements));
    }
  }, [state.placements]);

  // Initialize placements from tasks
  useEffect(() => {
    if (tasks.length > 0 && state.placements.length === 0) {
      const initialPlacements = tasks.map((task, index) => ({
        taskId: task.id,
        position: {
          x: (index % 5) * 2 - 4,
          y: 0,
          z: Math.floor(index / 5) * 2 - 4,
        },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
        room: state.currentRoom,
      }));

      setState(prev => ({ ...prev, placements: initialPlacements }));
    }
  }, [tasks]);

  return {
    state,
    rooms,
    enterVR,
    exitVR,
    switchRoom,
    placeTask,
    removeTaskPlacement,
    getRoomPlacements,
    getTaskPlacement,
  };
}

// Hook for XR frame updates
export function useXRFrame(onFrame: (pose: any) => void) {
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const xrSession = (window as any).navigator?.xr?.currentSession;
    if (!xrSession) return;

    const onXRFrame = (event: XRFrameEvent) => {
      const frame = event.frame;
      onFrame(frame);
    };

    xrSession.addEventListener('requestAnimationFrame', onXRFrame);

    return () => {
      xrSession.removeEventListener('requestAnimationFrame', onXRFrame);
    };
  }, [onFrame]);
}