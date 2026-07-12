"use client";

import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Task, List, Label } from "@/types";
import { GitBranch, Circle, Link2 } from "lucide-react";

interface DependencyGraphViewProps {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate?: (id: number, updates: Partial<Task>) => void;
  onTaskDelete?: (id: number) => void;
}

type ConnectionMode = "view" | "connect";

/**
 * Dependency Graph View - Visualizes task relationships as an interactive DAG.
 * Tasks are nodes, dependencies are directed edges.
 * Uses SVG for rendering with pan/zoom capabilities.
 */
export default function DependencyGraphView({
  tasks,
  lists,
  labels,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}: DependencyGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("view");
  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [temporaryEdge, setTemporaryEdge] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Filter to tasks with dependencies or that are depended upon
  const relevantTasks = useMemo(() => {
    const tasksWithDeps = tasks.filter(t => t.dependsOnTaskId || t.status !== "archived");
    if (tasksWithDeps.length === 0) return [];

    // Also include tasks that are dependencies of filtered tasks
    const depIds = new Set(tasksWithDeps.map(t => t.dependsOnTaskId).filter(Boolean));
    return tasks.filter(t =>
      tasksWithDeps.some(t2 => t2.id === t.id) || depIds.has(t.id)
    );
  }, [tasks]);

  // Build graph data structure
  const graphData = useMemo(() => {
    const nodes = relevantTasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      listId: task.listId,
      labelIds: task.labels || [],
      x: 0,
      y: 0,
    }));

    const edges = relevantTasks
      .filter(t => t.dependsOnTaskId)
      .map(t => ({
        source: t.dependsOnTaskId!,
        target: t.id,
      }));

    return { nodes, edges };
  }, [relevantTasks]);

  // Simple force-directed layout simulation (runs once on mount)
  const positionedNodes = useMemo(() => {
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));
    const width = 800;
    const height = 600;

    // Initialize positions in a grid
    graphData.nodes.forEach((node, idx) => {
      node.x = (idx % 4) * 200 + 100;
      node.y = Math.floor(idx / 4) * 150 + 75;
    });

    // Simulate repulsion and attraction
    const iterations = 100;
    const k = Math.sqrt(width * height / graphData.nodes.length);

    for (let i = 0; i < iterations; i++) {
      graphData.nodes.forEach(node => {
        // Repulsion from other nodes
        graphData.nodes.forEach(other => {
          if (node.id === other.id) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = k * k / dist;
          node.x += (dx / dist) * force * 0.1;
          node.y += (dy / dist) * force * 0.1;
        });

        // Attraction to connected nodes (edges)
        graphData.edges.forEach(edge => {
          if (edge.source === node.id) {
            const target = nodeMap.get(edge.target);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              node.x += dx * 0.05;
              node.y += dy * 0.05;
            }
          }
        });

        // Keep in bounds
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });
    }

    return graphData.nodes;
  }, [graphData]);

  // Handle zoom with mouse wheel
  const scale = 1;
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getStatusColor = (status: string) => {
    if (status === "completed" || status === "done") return "#10b981";
    if (status === "in-progress" || status === "in_progress") return "#f59e0b";
    return "#64748b";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "#ef4444";
    if (priority === "medium") return "#f59e0b";
    return "#3b82f6";
  };

  // Cycle detection - check if adding a dependency would create a loop
  const wouldCreateCycle = (sourceId: number, targetId: number): boolean => {
    const visited = new Set<number>();
    const stack = [targetId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === sourceId) return true; // Would create cycle
      if (visited.has(current)) continue;
      visited.add(current);

      const task = tasks.find(t => t.id === current);
      if (task?.dependsOnTaskId) {
        stack.push(task.dependsOnTaskId);
      }
    }
    return false;
  };

  // Handle node click in connection mode
  const handleNodeClick = (taskId: number) => {
    if (connectionMode === "connect") {
      if (sourceNode === null) {
        setSourceNode(taskId);
      } else if (sourceNode !== taskId) {
        // Check for cycle
        if (wouldCreateCycle(sourceNode, taskId)) {
          toast.error("Cannot create dependency: would cause a circular reference");
          return;
        }
        // Create the dependency
        onTaskUpdate?.(sourceNode, { dependsOnTaskId: taskId });
        setSourceNode(null);
        setConnectionMode("view");
      } else {
        // Clicked same node, cancel connection
        setSourceNode(null);
      }
    }
  };

  // Export graph as PNG
  const exportAsImage = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "dependency-graph.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export graph as PNG using canvas
  const exportAsPng = async () => {
    if (!svgRef.current) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "dependency-graph.png";
      a.click();
    };
    img.src = url;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="px-8 pt-8 pb-4 shrink-0 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitBranch size={20} className="text-accent" />
            <span>Dependency Graph</span>
          </h2>
          <p className="text-sm text-muted mt-1">
            Visual task relationships. Connected tasks require completion in order. Nodes show status/priority.
          </p>
        </div>
      </div>

      {/* Connection Mode Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => {
              setConnectionMode(connectionMode === "view" ? "connect" : "view");
              setSourceNode(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              connectionMode === "connect"
                ? "bg-accent text-white"
                : "bg-card/80 border border-border text-muted hover:text-foreground"
            }`}
            title="Toggle connection mode"
          >
            <Link2 size={14} />
            <span>{connectionMode === "view" ? "Connect Tasks" : "Cancel"}</span>
          </button>
          {connectionMode === "connect" && sourceNode && (
            <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-semibold">
              Click target task...
            </span>
          )}
        </div>

        {/* Export Buttons */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={exportAsImage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-card/80 border border-border text-muted hover:text-foreground"
            title="Export as SVG"
          >
            SVG
          </button>
          <button
            onClick={exportAsPng}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-card/80 border border-border text-muted hover:text-foreground"
            title="Export as PNG"
          >
            PNG
          </button>
        </div>

        <div className="flex-1 px-8 pb-8 relative overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full border border-border rounded-2xl bg-card/25 backdrop-blur-md overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {relevantTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <GitBranch size={48} className="text-muted/30 mb-4" />
              <p className="text-sm font-semibold text-foreground">No task dependencies yet</p>
              <p className="text-xs text-muted mt-1 max-w-sm">
                Add dependencies in task details to visualize relationships here.
              </p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 800 600"
              className="select-none cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
            >
              {/* Edges */}
              <g stroke="currentColor" strokeOpacity="0.2" strokeWidth="2">
                {graphData.edges.map((edge, idx) => {
                  const source = positionedNodes.find(n => n.id === edge.source);
                  const target = positionedNodes.find(n => n.id === edge.target);
                  if (!source || !target) return null;
                  return (
                    <path
                      key={`edge-${idx}`}
                      d={`M ${source.x} ${source.y} C ${source.x + 50} ${source.y + 50} ${target.x - 50} ${target.y - 50} ${target.x} ${target.y}`}
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </g>

              {/* Arrow marker definition */}
              <defs>
                <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" fillOpacity="0.3" />
                </marker>
              </defs>

              {/* Nodes */}
              <g>
                {positionedNodes.map(node => {
                  const task = tasks.find(t => t.id === node.id);
                  const isDone = node.status === "completed" || node.status === "done";
                  const isSelected = sourceNode === node.id;

                  // Draw temporary edge if connecting
                  const sourcePosition = sourceNode ? positionedNodes.find(n => n.id === sourceNode) : null;

                  return (
                    <g key={`node-${node.id}`}>
                      {/* Temporary edge being drawn */}
                      {connectionMode === "connect" && sourceNode && isSelected && sourcePosition && (
                        <line
                          x1={sourcePosition.x}
                          y1={sourcePosition.y}
                          x2={node.x}
                          y2={node.y}
                          stroke="var(--accent)"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="pointer-events-none"
                        />
                      )}
                      <g
                        onClick={() => task && (connectionMode === "connect" ? handleNodeClick(node.id) : onTaskClick(task))}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {/* Node background */}
                        <rect
                          x={node.x - 60}
                          y={node.y - 25}
                          width="120"
                          height="50"
                          rx="8"
                          fill="currentColor"
                          fillOpacity={connectionMode === "connect" && isSelected ? "0.15" : "0.05"}
                          stroke={connectionMode === "connect" && isSelected ? "#f59e0b" : getPriorityColor(node.priority)}
                          strokeWidth={connectionMode === "connect" && isSelected ? "3" : "2"}
                          className="hover:fill-accent/10 transition-all"
                        />
                        {/* Status indicator */}
                        <circle
                          cx={node.x - 40}
                          cy={node.y}
                          r="6"
                          fill={getStatusColor(node.status)}
                        />
                        {/* Node title */}
                        <text
                          x={node.x - 30}
                          y={node.y + 4}
                          fontSize="10"
                          fontWeight={connectionMode === "connect" && isSelected ? "700" : "600"}
                          fill="currentColor"
                          className="pointer-events-none"
                        >
                          {node.title.length > 18 ? `${node.title.slice(0, 18)}...` : node.title}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 p-3 rounded-xl bg-card/80 backdrop-blur-md border border-border text-xs space-y-2">
        <div className="flex items-center gap-2">
          <Circle size={8} fill="#64748b" />
          <span className="text-muted">Todo/Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle size={8} fill="#f59e0b" />
          <span className="text-muted">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle size={8} fill="#10b981" />
          <span className="text-muted">Completed</span>
        </div>
        <div className="h-px bg-border my-2" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-muted">Low Priority</span>
        </div>
      </div>
    </div>
  );
}