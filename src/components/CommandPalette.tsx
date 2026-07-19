import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Keyboard, Sparkles, Folder, Plus, Sun, Moon, Palette, BookOpenCheck, Filter } from "lucide-react";
import { useNaturalLanguageFilter } from @"/src/lib/hooks/useNaturalLanguageFilter";
import { Task } from @"/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  setView: (view: "dashboard" | "kanban" | "list" | "eisenhower" | "gamification" | "timemachine" | "habits") => void;
  onCreateTask: (title: string) => void;
  onSelectTask: (task: Task) => void;
  setThemeMode?: (mode: "light" | "dark" | "system") => void;
  setAccentColor?: (color: string) => void;
  onOpenShortcuts?: () => void;
  templates?: Task[];
  onCreateFromTemplate?: (templateId: number) => void;
}

function CommandPalette({
  isOpen,
  onClose,
  tasks,
  setView,
  onCreateTask,
  onSelectTask,
  setThemeMode,
  setAccentColor,
  onOpenShortcuts,
  templates,
  onCreateFromTemplate
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Let me calculate the remaining implementation: enable natural language commands, AI task generation, and template integration...