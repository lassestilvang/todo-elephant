"use client";

import { useState, useCallback } from "react";
import { Task } from "@/types";

interface FocusRoom {
  id: string;
  taskId: number;
  participants: { id: string; name: string }[];
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

  return {
    focusRooms,
    handoffRequests,
    isInRoom,
    createFocusRoom,
    joinFocusRoom,
    leaveFocusRoom,
    handoffTask,
    acceptHandoff,
    rejectHandoff,
    requestReview,
  };
}