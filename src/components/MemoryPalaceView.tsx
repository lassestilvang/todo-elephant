"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Mesh } from "three";
import { TreePine, DoorOpen, Package, ShoppingBag, Book, Heart, Zap } from "lucide-react";
import { Task, List, Label } from "@/types";
import { isCompletedStatus } from "@/src/lib/status";

interface MemoryPalaceViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate?: (id: number, updates: Partial<Task>) => void;
}

interface PalaceRoom {
  id: string;
  name: string;
  icon: any;
  color: string;
  tasks: Task[];
  position: [number, number, number];
}

export default function MemoryPalaceView({
  tasks,
  lists,
  labels,
  onTaskClick,
  onTaskUpdate,
}: MemoryPalaceViewProps) {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  // Organize tasks into "rooms" based on context
  const rooms = useMemo(() => {
    const activeTasks = tasks.filter(t => !isCompletedStatus(t.status));

    // Room assignments based on lists and labels
    const roomsMap: Record<string, PalaceRoom> = {
      work: {
        id: "work",
        name: "Office",
        icon: Package,
        color: "#3b82f6",
        tasks: activeTasks.filter(t => t.listId === 2 || t.labels?.includes(1)),
        position: [-4, 0, 0],
      },
      personal: {
        id: "personal",
        name: "Gym",
        icon: Heart,
        color: "#10b981",
        tasks: activeTasks.filter(t => t.listId === 3),
        position: [4, 0, 0],
      },
      inbox: {
        id: "inbox",
        name: "Entry Hall",
        icon: DoorOpen,
        color: "#f59e0b",
        tasks: activeTasks.filter(t => t.listId === 1),
        position: [0, 0, 0],
      },
      shopping: {
        id: "shopping",
        name: "Store",
        icon: ShoppingBag,
        color: "#ec4899",
        tasks: activeTasks.filter(t => t.labels?.includes(4)),
        position: [-4, 0, 4],
      },
      learning: {
        id: "learning",
        name: "Library",
        icon: Book,
        color: "#8b5cf6",
        tasks: activeTasks.filter(t => t.labels?.includes(5)),
        position: [4, 0, 4],
      },
      focus: {
        id: "focus",
        name: "Focus Room",
        icon: Zap,
        color: "#ef4444",
        tasks: activeTasks.filter(t => t.isImportant || t.priority === "high"),
        position: [0, 0, -4],
      },
    };

    return Object.values(roomsMap);
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TreePine size={24} className="text-accent" />
          <span>Memory Palace</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          Navigate your tasks spatially. Each room represents a different context.
        </p>
      </div>

      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 2, 12], fov: 60 }}
          className="rounded-2xl border border-border"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#1e293b" opacity={0.5} transparent />
          </mesh>

          {/* Rooms */}
          {rooms.map(room => (
            <Room
              key={room.id}
              room={room}
              isActive={activeRoom === room.id}
              onClick={() => setActiveRoom(room.id)}
              onTaskClick={onTaskClick}
            />
          ))}

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 4}
          />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border bg-card/40">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {rooms.map(room => {
            const Icon = room.icon;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  activeRoom === room.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card/40"
                }`}
              >
                <Icon size={16} style={{ color: room.color }} />
                <span className="text-xs font-medium">{room.name}</span>
                <span className="ml-auto text-[10px] bg-muted/20 px-1.5 py-0.5 rounded-full">
                  {room.tasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface RoomProps {
  room: PalaceRoom;
  isActive: boolean;
  onClick: () => void;
  onTaskClick: (task: Task) => void;
}

function Room({ room, isActive, onClick }: RoomProps) {
  const meshRef = useRef<Mesh>(null!);
  const Icon = room.icon;

  // Gentle pulsing animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
      );
    }
  });

  return (
    <group position={room.position}>
      {/* Room walls */}
      <mesh ref={meshRef} onClick={onClick}>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial
          color={room.color}
          opacity={isActive ? 0.8 : 0.4}
          transparent
        />
      </mesh>

      {/* Room label */}
      <Html position={[0, 1.2, 0]} center>
        <div className="flex flex-col items-center gap-1">
          <Icon size={24} style={{ color: room.color }} />
          <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded">
            {room.name}
          </span>
          <span className="text-[10px] text-muted">
            {room.tasks.length} tasks
          </span>
        </div>
      </Html>
    </group>
  );
}