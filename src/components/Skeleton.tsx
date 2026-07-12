"use client";

import React from "react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/15 ${className}`}
      aria-hidden="true"
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex-1 scroll-container px-8 py-8 h-screen animate-fade-in">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md glass-panel"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-14 w-14 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card/40 glass-panel space-y-4">
                <Skeleton className="h-4 w-36" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card/40 glass-panel space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border/60 bg-muted/10">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card/40 glass-panel space-y-4">
              <Skeleton className="h-4 w-44" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card/40 glass-panel h-[540px]">
            <Skeleton className="h-4 w-28 mb-4" />
            <div className="space-y-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 pl-4">
                  <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0 mt-1" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="px-8 pt-8 pb-4 shrink-0">
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex-1 overflow-x-auto px-8 pb-8 flex items-start gap-6">
        {[...Array(4)].map((_, colIdx) => (
          <div
            key={colIdx}
            className="w-80 shrink-0 rounded-2xl border border-border bg-card/25 glass-panel overflow-hidden"
          >
            <div className="px-4 py-3.5 border-b border-border border-t-4 border-t-border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-5 rounded-lg" />
              </div>
            </div>
            <div className="p-3 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-3.5 flex-1" />
                    <Skeleton className="h-4 w-14 rounded" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-1 w-full rounded-full" />
                  <div className="flex gap-1.5 pt-1.5 border-t border-border/40">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="px-8 pt-8 pb-4 shrink-0 space-y-4">
        <div>
          <Skeleton className="h-7 w-44 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-4 bg-card/25 backdrop-blur-md border border-border p-3 rounded-2xl glass-panel">
          <Skeleton className="h-9 flex-1 max-w-sm rounded-xl" />
          <Skeleton className="h-9 w-56 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      <div className="flex-1 px-8 pb-8 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-card/45 px-5 py-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border/40 bg-card/45 glass-panel space-y-3">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-border/40 bg-card/45 glass-panel">
            <Skeleton className="h-3 w-36 mb-4" />
            <Skeleton className="h-44 w-44 mx-auto rounded-full" />
          </div>
          <div className="lg:col-span-3 p-6 rounded-2xl border border-border/40 bg-card/45 glass-panel">
            <Skeleton className="h-3 w-32 mb-4" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Use each export so TS strict mode doesn't drop them; ensures they exist.
const _exports = [Skeleton, DashboardSkeleton, KanbanSkeleton, ListSkeleton, StatsSkeleton];

export { Skeleton, DashboardSkeleton, KanbanSkeleton, ListSkeleton, StatsSkeleton };
export default _exports[0];
