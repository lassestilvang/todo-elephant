"use client";

import React from "react";
import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6 glass-panel rounded-2xl p-8 border border-border">
        <div className="text-6xl font-extrabold text-accent/20">404</div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Page not found</h2>
          <p className="text-sm text-muted">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/95 shadow-md hover-lift glow-primary transition-all"
        >
          <Home size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
