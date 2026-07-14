"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Navigation, Calendar, TrendingUp, Route, Clock } from "lucide-react";
import { Task } from "@/types";

interface LocationTask {
  location: { lat: number; lng: number; name?: string };
  date: string;
  count: number;
}

interface MigrationMapViewProps {
  tasks: Task[];
}

export default function MigrationMapView({ tasks }: MigrationMapViewProps) {
  const [isTracking, setIsTracking] = useState(false);

  // Get location-aware task data (simulated - would integrate with actual GPS in production)
  const migrationData = useMemo(() => {
    // In production, this would use browser geolocation API
    // For demo, we'll generate simulated locations based on task creation dates

    const locations: LocationTask[] = [];
    const locationsList = [
      "Home Office",
      "Coffee Shop",
      "Co-working Space",
      "Airport Lounge",
      "Library",
      "Park Bench",
      "Client Office",
    ];

    tasks.slice(0, 50).forEach((task, i) => {
      if (task.createdAt) {
        const date = task.createdAt.split("T")[0];
        const lat = 40.7128 + (Math.sin(i) * 0.1); // NYC area for demo
        const lng = -74.006 + (Math.cos(i) * 0.1);

        const existing = locations.find(l => l.date === date);
        if (existing) {
          existing.count += 1;
        } else {
          locations.push({
            location: {
              lat,
              lng,
              name: locationsList[i % locationsList.length],
            },
            date,
            count: 1,
          });
        }
      }
    });

    return locations.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [tasks]);

  const startTracking = () => {
    if ("geolocation" in navigator) {
      setIsTracking(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Location:", pos.coords);
          // Would save location with task completion in production
        },
        (err) => {
          console.error("Geolocation error:", err);
          setIsTracking(false);
        }
      );
    }
  };

  const streak = migrationData.filter(d => d.count > 0).length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in p-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Navigation size={24} className="text-accent" />
          <span>Migration Map</span>
        </h2>
        <p className="text-sm text-muted mt-1">
          See where you complete tasks and track your location patterns.
        </p>
      </div>

      {/* Map Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={20} className="text-accent" />
            <span className="font-bold text-sm">Unique Locations</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {migrationData.length}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Route size={20} className="text-accent" />
            <span className="font-bold text-sm">Migration Streak</span>
          </div>
          <div className="text-3xl font-black text-foreground">
            {streak} days
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/40">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-accent" />
            <span className="font-bold text-sm">Most Active Place</span>
          </div>
          <div className="text-lg font-bold text-foreground line-clamp-1">
            {migrationData.length > 0
              ? migrationData.reduce((max, d) => d.count > max.count ? d : max).location.name
              : "No data"}
          </div>
        </div>
      </div>

      {/* Location Timeline */}
      <div className="flex-1">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          Location Timeline
        </h3>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {migrationData.map((day, idx) => (
            <div
              key={day.date}
              className="p-4 rounded-xl border border-border bg-card/40 flex items-center gap-4"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{day.date}</div>
                <div className="text-xs text-muted">{day.location.name}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-sm font-bold">{day.count} tasks</span>
              </div>

              <button
                onClick={() => console.log("View location for", day.date)}
                className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-all"
              >
                View on Map
              </button>
            </div>
          ))}

          {migrationData.length === 0 && (
            <div className="text-center py-8 text-muted">
              <MapPin size={48} className="mx-auto mb-2 opacity-30" />
              <p>Start completing tasks to build your migration map!</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Tracker Button */}
      <div className="mt-6">
        <button
          onClick={startTracking}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto ${
            isTracking
              ? "bg-emerald-500 text-white animate-pulse"
              : "bg-accent/10 text-accent hover:bg-accent/20"
          } transition-all`}
        >
          <Navigation size={18} />
          {isTracking ? "Tracking Location..." : "Start Location Tracking"}
        </button>
        <p className="text-xs text-muted text-center mt-2">
          Track where you complete tasks to optimize your work environment
        </p>
      </div>
    </div>
  );
}