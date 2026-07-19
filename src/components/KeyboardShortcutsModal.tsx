"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard, Command, FileDown, Layout, List, Calendar, BarChart3, Search, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Shortcut {
  keys: string;
  action: string;
  description: string;
  category: 'navigation' | 'tasks' | 'views' | 'global';
}

const SHORTCUTS: Shortcut[] = [
  // Global
  { keys: '⌘K', action: 'Open Command Palette', description: 'Quick access to all commands', category: 'global' },
  { keys: '⌘N', action: 'New Task', description: 'Create a new task', category: 'tasks' },
  { keys: '⌘S', action: 'Save', description: 'Save current work', category: 'global' },
  { keys: '?', action: 'Show Shortcuts', description: 'Display this help dialog', category: 'global' },

  // Navigation
  { keys: '← →', action: 'Navigate', description: 'Previous/next item', category: 'navigation' },
  { keys: '⌘[', action: 'Go Back', description: 'Navigate to previous view', category: 'navigation' },
  { keys: '⌘]', action: 'Go Forward', description: 'Navigate to next view', category: 'navigation' },

  // Views
  { keys: '1', action: 'Dashboard', description: 'Switch to Dashboard view', category: 'views' },
  { keys: '2', action: 'Kanban', description: 'Switch to Kanban view', category: 'views' },
  { keys: '3', action: 'List', description: 'Switch to List view', category: 'views' },
  { keys: '4', action: 'Calendar', description: 'Switch to Calendar view', category: 'views' },
  { keys: '5', action: 'Stats', description: 'Switch to Stats view', category: 'views' },

  // Tasks
  { keys: 'Enter', action: 'Complete/Edit', description: 'Complete or edit selected task', category: 'tasks' },
  { keys: '⌘D', action: 'Duplicate', description: 'Duplicate current task', category: 'tasks' },
  { keys: '⌘⌫', action: 'Delete', description: 'Delete current task', category: 'tasks' },
  { keys: 'Tab', action: 'Next Field', description: 'Move to next field in form', category: 'tasks' },

  // Search & Filter
  { keys: '⌘F', action: 'Search', description: 'Search tasks', category: 'views' },
  { keys: '/', action: 'Filter', description: 'Quick filter tasks', category: 'views' },

  // Settings
  { keys: '⌘', action: 'Settings', description: 'Open settings', category: 'global' },
];

const CATEGORIES = [
  { id: 'global', label: 'Global', icon: Settings },
  { id: 'navigation', label: 'Navigation', icon: ChevronLeft },
  { id: 'views', label: 'Views', icon: Layout },
  { id: 'tasks', label: 'Tasks', icon: List },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCategory?: string;
}

export function KeyboardShortcutsModal({ open, onOpenChange, activeCategory = 'global' }: KeyboardShortcutsModalProps) {
  const filteredShortcuts = activeCategory === 'all'
    ? SHORTCUTS
    : SHORTCUTS.filter(s => s.category === activeCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-accent" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <div key={id}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredShortcuts
                    .filter(s => s.category === id)
                    .map((shortcut) => (
                      <div
                        key={shortcut.keys}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-sm">{shortcut.action}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{shortcut.description}</div>
                        </div>
                        <kbd className="px-2 py-0.5 bg-border rounded text-xs font-mono">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="text-xs text-muted text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded font-mono">?</kbd> anytime to show shortcuts
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}