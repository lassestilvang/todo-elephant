"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Text, Sphere, Box, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { Task, List, Label } from '@/types';

interface VRViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskClick: (task: Task) => void;
}

const roomSize = { width: 15, height: 8, depth: 10 };

export function VRView({ tasks, lists, labels, onTaskClick }: VRViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const groupRef = useRef<THREE.Group>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const taskNodes = getTaskNodes(tasks, lists, labels);
  const { camera, scene } = useThree();

  const handlePointerMove = useCallback((event: any) => {
    if (event.touches) {
      const touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
      taskNodes.map(node => node.object)
    );

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const taskId = intersectedObject.userData?.taskId;
      if (taskId) {
        scene.traverse((child) => {
          if (child.userData?.isTaskNode) {
            if (child.userData.taskId === taskId) {
              (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x22c55e);
              (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
            } else {
              (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
              (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
            }
          }
        });
      }
    }
  }, [camera, scene, taskNodes]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
    };
  }, [handlePointerMove]);

  const handleClick = useCallback((event: any) => {
    if (event.touches) {
      const touch = event.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      taskNodes.map(node => node.object)
    );

    if (intersects.length > 0) {
      const taskId = intersects[0].object.userData?.taskId;
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        onTaskClick(task);
      }
    }
  }, [camera, taskNodes, tasks, onTaskClick]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Canvas
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        style={{ flex: 1 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x0f172a, 1);
        }}
      >
        <ambientLight color="#ffffff" intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} color="#ffffff" castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#f59e0b" />
        <pointLight position={[5, 5, -5]} intensity={0.5} color="#22c55e" />

        <Room roomSize={roomSize} />

        <TaskNodes
          taskNodes={taskNodes}
          onHover={(taskId: number | null) => {
            if (taskId) {
              const task = tasks.find(t => t.id === taskId);
              if (task) setSelectedTask(task);
            } else {
              setSelectedTask(null);
            }
          }}
        />

        <AxesHelper args={[3]} />
      </Canvas>

      <UIOverlay
        selectedTask={selectedTask}
        viewMode={viewMode}
        setViewMode={setViewMode}
        taskCount={tasks.length}
        completedCount={tasks.filter(t => t.status === 'completed').length}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}

function Room({ roomSize }: { roomSize: { width: number; height: number; depth: number } }) {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, roomSize.height / 2, -roomSize.depth / 2]}>
        <planeGeometry args={[roomSize.width, roomSize.height]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow position={[0, roomSize.height / 2, roomSize.depth / 2]}>
        <planeGeometry args={[roomSize.width, roomSize.height]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow position={[-roomSize.width / 2, roomSize.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow position={[roomSize.width / 2, roomSize.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[roomSize.depth, roomSize.height]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, roomSize.height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomSize.width, roomSize.depth]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface TaskNodeData {
  object: THREE.Mesh;
  task: Task;
  list: List | undefined;
  label: Label | undefined;
}

function getTaskNodes(tasks: Task[], lists: List[], labels: Label[]): TaskNodeData[] {
  return tasks.map((task, index) => {
    const list = lists.find(l => l.id === task.listId);
    const label = labels.find(l => task.labels?.includes(l.id));

    const geometry = new THREE.BoxGeometry(0.8, 0.4, 0.2);
    const material = new THREE.MeshStandardMaterial({
      color: list?.color || '#3b82f6',
      roughness: 0.3,
      metalness: 0.1,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (index % 5 - 2) * 2,
      1.6 + Math.floor(index / 5) * 0.6,
      -2
    );
    mesh.userData = { isTaskNode: true, taskId: task.id };
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return { object: mesh, task, list, label };
  });
}

function TaskNodes({
  taskNodes,
  onHover
}: {
  taskNodes: TaskNodeData[];
  onHover: (taskId: number | null) => void;
}) {
  return (
    <group ref={groupRef}>
      {taskNodes.map((node, index) => (
        <TaskNode
          key={node.task.id}
          node={node}
          index={index}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function TaskNode({
  node,
  index,
  onHover
}: {
  node: TaskNodeData;
  index: number;
  onHover: (taskId: number | null) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
      ref.current.position.y = node.object.position.y + Math.sin(state.clock.getElapsedTime() + index) * 0.05;
    }
  });

  return (
    <mesh
      ref={ref}
      position={node.object.position}
      onPointerOver={() => onHover(node.task.id)}
      onPointerOut={() => onHover(null)}
      onClick={() => onHover(node.task.id)}
    >
      <boxGeometry args={[0.8, 0.4, 0.2]} />
      <meshStandardMaterial
        color={node.list?.color || '#3b82f6'}
        roughness={0.3}
        metalness={0.1}
        emissive="#000000"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function AxesHelper({ args }: { args: number[] }) {
  const [x, y, z] = args;
  return (
    <group>
      <Line start={[0, 0, 0]} end={[x, 0, 0]} color="red" />
      <Line start={[0, 0, 0]} end={[0, y, 0]} color="green" />
      <Line start={[0, 0, 0]} end={[0, 0, z]} color="blue" />
    </group>
  );
}

function UIOverlay({
  selectedTask,
  viewMode,
  setViewMode,
  taskCount,
  completedCount,
  onClose
}: {
  selectedTask: Task | null;
  viewMode: 'overview' | 'detailed';
  setViewMode: (mode: 'overview' | 'detailed') => void;
  taskCount: number;
  completedCount: number;
  onClose: () => void;
}) {
  if (viewMode === 'detailed' && selectedTask) {
    return (
      <Html
        position={[0, 2.5, -3]}
        rotation={[-0.3, 0, 0]}
        style={{
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
        }}
      >
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-2xl max-w-xs w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 mb-4">{selectedTask.description || 'No description'}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                {selectedTask.priority}
              </span>
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                {selectedTask.status}
              </span>
            </div>
            {selectedTask.dueDate && (
              <div className="text-slate-400">📅 Due: {new Date(selectedTask.dueDate).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </Html>
    );
  }

  return (
    <Html
      position={[0, 3, -2]}
      rotation={[-0.3, 0, 0]}
      style={{
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
      }}
    >
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 backdrop-blur-md shadow-2xl min-w-[200px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🐘</span>
          <div>
            <h2 className="text-xl font-bold text-white">Todo Elephant VR</h2>
            <p className="text-sm text-slate-400">{taskCount} tasks • {completedCount} completed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'overview'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === 'detailed'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Details
          </button>
        </div>
      </div>
    </Html>
  );
}

export default VRView;