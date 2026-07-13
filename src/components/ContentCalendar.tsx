"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  createdAt: string;
}

export default function ContentCalendar() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });

  // Fetch existing events from API
  useEffect(() => {
    fetch("/api/elephant/calendar")
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .catch(err => console.error("Failed to fetch events:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    const response = await fetch("/api/elephant/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description || ""
      })
    });

    const data = await response.json();
    if (data.success) {
      setEvents([...events, data.data]);
      setNewEvent({ title: "", date: "", description: "" });
      setShowAddForm(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    await fetch(`/api/elephant/calendar/${eventId}`, { method: "DELETE" });
    setEvents(events.filter(e => e.id !== eventId));
  };

  const filteredEvents = events.filter(e => e.date === selectedDate);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calendar size={24} className="text-accent" />
          <span>Content Calendar</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          Plan and track your creative content schedule.
        </p>
      </div>

      {/* Date selector */}
      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="text-sm font-medium bg-card/40 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Events list */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
            <Calendar size={48} className="text-muted/30 mx-auto mb-4" />
            <p className="text-muted font-medium">No events on this date</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              className="p-4 rounded-xl border border-border bg-card/40 space-y-2 hover-lift"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-sm">{event.title}</h3>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="Delete event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {event.description && (
                <p className="text-xs text-muted">{event.description}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-8 right-8 z-20 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center"
        title="Add event"
      >
        <Plus size={24} />
      </button>

      {/* Add event modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-lg font-bold">Add Calendar Event</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
              <input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent resize-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-border text-muted hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}