"use client";

import { useState, useEffect } from 'react';
import { Save, RotateCcw, ArrowLeftRight, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  action: string;
  description: string;
  category: 'global' | 'navigation' | 'tasks' | 'views';
  conflictWith?: string;
}

interface CustomShortcut {
  key: string;
  action: string;
  description: string;
  category: 'global' | 'navigation' | 'tasks' | 'views';
  id: string;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: '⌘K', action: 'openCreateModal', description: 'Open new task modal', category: 'global' },
  { key: '⌘S', action: 'saveTask', description: 'Save current task', category: 'global' },
  { key: '⌘N', action: 'newTask', description: 'Create new task', category: 'tasks' },
  { key: '⌘F', action: 'search', description: 'Search tasks', category: 'views' },
  { key: '⌘/', action: 'filter', description: 'Filter tasks', category: 'views' },
  { key: '⌘1', action: 'viewDashboard', description: 'Switch to Dashboard', category: 'views' },
  { key: '⌘2', action: 'viewKanban', description: 'Switch to Kanban', category: 'views' },
  { key: '⌘3', action: 'viewList', description: 'Switch to List', category: 'views' },
  { key: '⌘4', action: 'viewCalendar', description: 'Switch to Calendar', category: 'views' },
  { key: '⌘5', action: 'viewStats', description: 'Switch to Stats', category: 'views' },
  { key: 'Enter', action: 'completeTask', description: 'Complete/edit task', category: 'tasks' },
  { key: '⌘D', action: 'duplicateTask', description: 'Duplicate task', category: 'tasks' },
  { key: '⌘Delete', action: 'deleteTask', description: 'Delete task', category: 'tasks' },
  { key: '⌘Z', action: 'undo', description: 'Undo last action', category: 'global' },
  { key: '⌘ShiftZ', action: 'redo', description: 'Redo last action', category: 'global' },
  { key: 'Escape', action: 'closeModal', description: 'Close modal', category: 'global' },
  { key: 'Tab', action: 'nextField', description: 'Navigate to next field', category: 'tasks' },
];

export default function KeyboardShortcutCustomizer() {
  const [shortcuts, setShortcuts] = useState<CustomShortcut[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Load custom shortcuts from localStorage
    const saved = localStorage.getItem('elephant-shortcuts');
    if (saved) {
      setShortcuts(JSON.parse(saved));
    } else {
      // Initialize with empty custom shortcuts
      setShortcuts([]);
    }
  }, []);

  useEffect(() => {
    // Save shortcuts to localStorage when changed
    localStorage.setItem('elephant-shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const handleAddShortcut = (shortcut: KeyboardShortcut) => {
    // Check for conflicts
    const exists = shortcuts.some(s => s.key === shortcut.key);
    if (exists) {
      toast.error('Shortcut already assigned to another action');
      return;
    }

    const newShortcut: CustomShortcut = {
      ...shortcut,
      id: Math.random().toString(36).substr(2, 9)
    };

    setShortcuts(prev => [...prev, newShortcut]);
    toast.success('Shortcut added successfully');
  };

  const handleRemoveShortcut = (shortcutId: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== shortcutId));
    toast.success('Shortcut removed');
  };

  const handleReorderShortcut = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === shortcuts.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedShortcuts = [...shortcuts];
    [updatedShortcuts[index], updatedShortcuts[newIndex]] =
      [updatedShortcuts[newIndex], updatedShortcuts[index]];
    setShortcuts(updatedShortcuts);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to save shortcuts
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Keyboard shortcuts saved successfully! 🐘');
    setIsSaving(false);
  };

  const handleReset = () => {
    if (confirm('Reset all custom shortcuts? This cannot be undone.')) {
      setShortcuts([]);
      toast.success('Custom shortcuts reset');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      global: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      navigation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      tasks: 'bg-green-500/20 text-green-400 border-green-500/30',
      views: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const filteredShortcuts = selectedCategory === 'all'
    ? shortcuts
    : shortcuts.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <Keyboard size={64} mood="happy" className="text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Customize Keyboard Shortcuts</h1>
          <p className="text-gray-400">Tailor your elephant's productivity shortcuts to your herd</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className={`px-4 py-2 rounded-xl transition-colors ${showConflicts
                  ? 'bg-accent/20 text-accent'
                  : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                <ArrowLeftRight size={16} className="inline mr-2" />
                Show Conflicts
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <RotateCcw size={16} className="inline mr-2" />
                Reset All
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Shortcuts'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Category Filter */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full p-3 rounded-xl text-left transition-all ${selectedCategory === 'all'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  All Shortcuts ({shortcuts.length})
                </button>
                {['global', 'navigation', 'tasks', 'views'].map(category => {
                  const count = shortcuts.filter(s => s.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${selectedCategory === category
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="capitalize">{category}</span>
                        <span className="text-xs opacity-70">({count})</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">DEFAULT SHORTCUTS</h4>
                <div className="space-y-2">
                  {DEFAULT_SHORTCUTS.map((shortcut, index) => {
                    const isAdded = shortcuts.some(s => s.key === shortcut.key);
                    return (
                      <button
                        key={shortcut.key}
                        onClick={() => handleAddShortcut(shortcut)}
                        disabled={isAdded}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-all ${isAdded
                          ? 'opacity-50 cursor-not-allowed bg-slate-800/50'
                          : 'bg-slate-700/50 hover:bg-slate-600 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono">{shortcut.key}</span>
                          <span className="text-gray-500">{shortcut.action}</span>
                        </div>
                        {isAdded && (
                          <div className="text-green-400 text-xs mt-1">✓ Added</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Shortcuts List */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-2xl border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white">Your Custom Shortcuts</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {shortcuts.length} custom shortcuts configured
                </p>
              </div>

              {filteredShortcuts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">⌨️</div>
                  <h3 className="text-lg font-bold text-white mb-2">No custom shortcuts yet</h3>
                  <p className="text-gray-400 mb-4">
                    Add shortcuts from the categories above to get started
                  </p>
                  <button
                    onClick={() => setSelectedCategory('global')}
                    className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    Add Your First Shortcut
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredShortcuts.map((shortcut, index) => (
                    <div
                      key={shortcut.id}
                      className="p-4 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-xs text-gray-500 font-mono bg-slate-700 px-2 py-1 rounded">
                            {shortcut.key}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{shortcut.action}</div>
                            <div className="text-xs text-gray-400">{shortcut.description}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(shortcut.category)}`}
                          >
                            {shortcut.category}
                          </span>

                          <button
                            onClick={() => handleReorderShortcut(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
                          >
                            <ChevronUp size={14} className="text-gray-400" />
                          </button>

                          <button
                            onClick={() => handleReorderShortcut(index, 'down')}
                            disabled={index === filteredShortcuts.length - 1}
                            className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
                          >
                            <ChevronDown size={14} className="text-gray-400" />
                          </button>

                          <button
                            onClick={() => handleRemoveShortcut(shortcut.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export/Import Section */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Shortcut Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    const data = JSON.stringify(shortcuts, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'elephant-shortcuts.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Shortcuts exported successfully!');
                  }}
                  className="p-4 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                >
                  <div className="font-semibold mb-1">Export Shortcuts</div>
                  <div className="text-sm opacity-70">Save to JSON file</div>
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const imported = JSON.parse(e.target?.result as string);
                            if (Array.isArray(imported)) {
                              setShortcuts(imported);
                              toast.success('Shortcuts imported successfully!');
                            } else {
                              toast.error('Invalid shortcut file format');
                            }
                          } catch {
                            toast.error('Failed to parse shortcut file');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="p-4 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
                >
                  <div className="font-semibold mb-1">Import Shortcuts</div>
                  <div className="text-sm opacity-70">Load from JSON file</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}