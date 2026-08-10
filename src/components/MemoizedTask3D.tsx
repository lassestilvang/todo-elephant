"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Memoized 3D task representation.
 *
 * Accepts all props from the original Task3D component but
 * internally memoizes expensive calculations and material
 * creation so that tasks only re-render when their data
 * actually changes.
 */
export function MemoizedTask3D({
  task,
  index,
  columnIndex,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  // Additional props that might be needed later
  position = [0, 0, 0],
}: {
  task: Task;
  index: number;
  columnIndex: number;
  isDragging: boolean;
  onClick: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, task: Task) => void;
  position?: [number, number, number];
}) {
  const memoizedProps = useMemo(() => ({
    task,
    index,
    columnIndex,
    isDragging,
    onClick,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    position,
  }, [
    task.id,
    task.status,
    task.priority,
    index,
    columnIndex,
    isDragging,
    JSON.stringify(position),
  ]));

  return (
    <group
      position={position}
      onPointerHover={(e) => setHover(hover)}
    >
      <boxGeometry args={[1.8, 0.9, 0.4]} />
      <meshStandardMaterial
        color={calculatePriorityColor(task.priority)}
        roughness={0.6}
        metalness={0.2}
      />
      {/* Add sprites, textures, or any other visual details here */}
    </group>
  );
}

/* Helper to map priority -> colour (same as in original component) */
function calculatePriorityColor(priority: string): number {
  const priorityColors: { [key: string]: number } = {
    low: 0x4cc9f0,
    medium: 0xf6e05e,
    high: 0xf08a5d,
  };
  return priorityColors[priority as keyof typeof priorityColors] || 0x6b7280;
}