"use client";

import React, { useState, useEffect } from "react";
import { Book, Plus, Search, Link2, FileText, Tag, X } from "lucide-react";
import { Task } from "@/types";

interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  relatedTaskIds: number[];
  createdAt: string;
  updatedAt: string;
}

interface IvoryTowerViewProps {
  tasks: Task[];
}

export default function IvoryTowerView({ tasks }: IvoryTowerViewProps) {
  const [notes, setNotes] = useState<KnowledgeNote[]>(() => {
    const saved = localStorage.getItem("todo-elephant-knowledge");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null);

  useEffect(() => {
    localStorage.setItem("todo-elephant-knowledge", JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const saveNote = (note: Partial<KnowledgeNote>) => {
    const now = new Date().toISOString();

    if (editingNote) {
      // Update existing
      setNotes(notes.map(n =>
        n.id === editingNote.id
          ? { ...n, ...note, updatedAt: now }
          : n
      ));
    } else {
      // Create new
      const newNote: KnowledgeNote = {
        id: crypto.randomUUID(),
        title: note.title || "Untitled Note",
        content: note.content || "",
        tags: note.tags || [],
        relatedTaskIds: note.relatedTaskIds || [],
        createdAt: now,
        updatedAt: now,
      };
      setNotes([...notes, newNote]);
    }

    setEditingNote(null);
    setShowNewNote(false);
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden animate-fade-in">

      {/* Sidebar - Notes List */}
      <div className="w-80 border-r border-border bg-card/40 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Book size={20} className="text-accent" />
            <h2 className="font-bold text-sm">Ivory Tower</h2>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search knowledge..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-background/50 border border-border rounded-lg focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <Book size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes found</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  selectedNote?.id === note.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card/40 hover:bg-card/60"
                }`}
              >
                <div className="font-medium text-sm line-clamp-1 mb-1">{note.title}</div>
                <div className="text-xs text-muted line-clamp-2">
                  {note.content.substring(0, 80)}...
                </div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-muted/20 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => {
            setEditingNote(null);
            setShowNewNote(true);
          }}
          className="m-3 p-3 rounded-xl bg-accent/10 text-accent font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/20 transition-all"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      {/* Main Content - Note Editor/Viewer */}
      <div className="flex-1 flex flex-col p-8">
        {selectedNote ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold">{selectedNote.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingNote(selectedNote);
                    setShowNewNote(true);
                  }}
                  className="p-2 rounded-lg bg-muted/10 text-muted hover:text-foreground hover:bg-muted/20 transition-all"
                  title="Edit note"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteNote(selectedNote.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="Delete note"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 prose prose-invert max-w-none">
              <p className="text-foreground/90 whitespace-pre-wrap">
                {selectedNote.content}
              </p>
            </div>

            {selectedNote.relatedTaskIds.length > 0 && (
              <div className="mt-6 p-4 rounded-xl border border-border bg-card/40">
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Link2 size={14} className="text-accent" />
                  Related Tasks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNote.relatedTaskIds.map(taskId => {
                    const task = tasks.find(t => t.id === taskId);
                    if (!task) return null;
                    return (
                      <span
                        key={taskId}
                        className="px-2 py-1 text-xs bg-accent/10 text-accent rounded"
                      >
                        {task.title}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Book size={64} className="text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-muted mb-2">Select a note or create one</h3>
              <p className="text-sm text-muted/60">
                Build your knowledge base - every completed task adds to your elephant's memory!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {showNewNote && (
        <NoteEditor
          note={editingNote}
          tasks={tasks}
          onSave={saveNote}
          onClose={() => setShowNewNote(false)}
        />
      )}
    </div>
  );
}

interface NoteEditorProps {
  note: KnowledgeNote | null;
  tasks: Task[];
  onSave: (note: Partial<KnowledgeNote>) => void;
  onClose: () => void;
}

function NoteEditor({ note, tasks, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState((note?.tags || []).join(", "));
  const [relatedTasks, setRelatedTasks] = useState((note?.relatedTaskIds || []).map(String));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      content,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      relatedTaskIds: relatedTasks.map(Number),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl p-8 rounded-2xl border border-border bg-card/90 space-y-4"
      >
        <h3 className="text-xl font-bold">
          {note ? "Edit Note" : "New Note"}
        </h3>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
            placeholder="Capture your knowledge here..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
            placeholder="work, productivity, ideas..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted mb-2">Related Tasks</label>
          <select
            multiple
            value={relatedTasks}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setRelatedTasks(selected);
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent h-32"
          >
            {tasks.map(task => (
              <option key={task.id} value={String(task.id)}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-white font-bold hover:bg-accent/90 transition-all"
          >
            Save Note
          </button>
        </div>
      </form>
    </div>
  );
}