"use client";

import { useState, useCallback, useEffect } from "react";
import { Task } from "@/types";
import { toast } from "sonner";

interface FocusRoom {
  id: string;
  taskId: number;
  participants: { id: string; name: string; avatar?: string }[];
  startTime: string;
  isActive: boolean;
}

interface HandoffRequest {
  id: string;
  taskId: number;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  note?: string;
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

interface SharedTask extends Task {
  sharedWith?: string[];
  shareToken?: string;
  lastEditedBy?: { name: string; at: string };
}

/**
 * Collaboration features for teams:
 * - Shared focus rooms (real-time focus sessions)
 * - Task handoff between teammates
 * - Review requests
 */
export function useCollaboration() {
  const [focusRooms, setFocusRooms] = useState<FocusRoom[]>([]);
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [isInRoom, setIsInRoom] = useState(false);

  // Create a shared focus room
  const createFocusRoom = useCallback((taskId: number) => {
    const roomId = `room-${Date.now()}`;
    const room: FocusRoom = {
      id: roomId,
      taskId,
      participants: [{ id: "current-user", name: "You" }],
      startTime: new Date().toISOString(),
      isActive: true,
    };
    setFocusRooms(prev => [...prev, room]);
    setIsInRoom(true);

    // Emit to participants (in real app, would use WebSocket/SSE)
    localStorage.setItem(`focus-room-${roomId}`, JSON.stringify(room));
    return roomId;
  }, []);

  // Join a focus room
  const joinFocusRoom = useCallback((roomId: string) => {
    setFocusRooms(prev => prev.map(room =>
      room.id === roomId
        ? { ...room, participants: [...room.participants, { id: "current-user", name: "You" }] }
        : room
    ));
    setIsInRoom(true);
  }, []);

  // Leave focus room
  const leaveFocusRoom = useCallback((roomId: string) => {
    setFocusRooms(prev => prev.map(room =>
      room.id === roomId
        ? { ...room, participants: room.participants.filter(p => p.id !== "current-user") }
        : room
    ));
    setIsInRoom(false);
  }, []);

  // Request task handoff to teammate
  const handoffTask = useCallback((task: Task, toUserId: string, toUserName: string, note?: string) => {
    const request: HandoffRequest = {
      id: `handoff-${Date.now()}`,
      taskId: task.id,
      fromUserId: "current-user",
      fromUserName: "You",
      toUserId,
      toUserName,
      note,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    setHandoffRequests(prev => [...prev, request]);

    // In real app, would send notification via WebSocket/push
    console.log(`Handoff request sent to ${toUserName}`, request);
    return request.id;
  }, []);

  // Accept handoff request
  const acceptHandoff = useCallback((requestId: string) => {
    setHandoffRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: "accepted" } : req
    ));
    // In real app, would actually transfer task ownership
  }, []);

  // Reject handoff request
  const rejectHandoff = useCallback((requestId: string) => {
    setHandoffRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: "rejected" } : req
    ));
  }, []);

  // Request review for a task
  const requestReview = useCallback((taskId: number, reviewerId: string) => {
    // Similar to handoff but for review/approval
    const request: HandoffRequest = {
      id: `review-${Date.now()}`,
      taskId,
      fromUserId: "current-user",
      fromUserName: "You",
      toUserId: reviewerId,
      toUserName: "Reviewer",
      note: "Please review this task before marking complete",
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    setHandoffRequests(prev => [...prev, request]);
    return request.id;
  }, []);

  // Shared task management
const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([]);

// Load shared tasks on mount
useEffect(() => {
  const stored = localStorage.getItem("todo-elephant-shared-tasks");
  if (stored) {
    try {
      setSharedTasks(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse shared tasks:", e);
    }
  }
}, []);

// Share a task with collaborators
const shareTask = useCallback(async (taskId: number, shareWith: string[]): Promise<boolean> => {
  try {
    const shareToken = crypto.randomUUID().split("-")[0];
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareWith, shareToken }),
    });

    if (response.ok) {
      const updated = (await response.json()) as SharedTask;
      setSharedTasks(prev => {
        const existing = prev.find(t => t.id === taskId);
        const newTasks = existing
          ? prev.map(t => (t.id === taskId ? updated : t))
          : [...prev, updated];
        localStorage.setItem("todo-elephant-shared-tasks", JSON.stringify(newTasks));
        return newTasks;
      });

      toast.success(`Task shared with ${shareWith.length} collaborator(s)`);
      return true;
    }
  } catch (e) {
    console.error("Share failed:", e);
    toast.error("Failed to share task");
  }
  return false;
}, []);

// Calculate collaboration streak
const [collaborationStreak, setCollaborationStreak] = useState(0);

useEffect(() => {
  const dates = sharedTasks
    .map(t => t.lastEditedBy?.at || t.updatedAt)
    .filter(Boolean)
    .map(d => d!.split("T")[0])
    .sort((a, b) => (a < b ? 1 : -1));

  const uniqueDates = [...new Set(dates)];
  if (uniqueDates.length === 0) {
    setCollaborationStreak(0);
    return;
  }

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
        streak++;
      } else {
        break;
      }
    }
  }
  setCollaborationStreak(streak);
}, [sharedTasks]);

return {
    focusRooms,
    handoffRequests,
    sharedTasks,
    collaborationStreak,
    isInRoom,
    createFocusRoom,
    joinFocusRoom,
    leaveFocusRoom,
    handoffTask,
    acceptHandoff,
    rejectHandoff,
    requestReview,
    shareTask,
  };
}