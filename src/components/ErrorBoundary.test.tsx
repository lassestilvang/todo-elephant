/**
 * ErrorBoundary unit tests.
 *
 * Strategy: render ErrorBoundary in a happy-dom container using
 * react-dom/client.createRoot + React.act. This exercises the actual
 * production lifecycle (componentDidCatch, getDerivedStateFromError, re-render
 * with fallback) rather than relying on react-dom/server's reconciler, which
 * in React 19 does NOT reliably trigger ErrorBoundary fallback for class
 * components whose render throws.
 *
 * happy-dom is already configured as vitest's environment (see
 * vitest.config.ts), so no extra setup is needed.
 * `act` is imported from `react` per the React 19 canonical export.
 *
 * No @testing-library/react dep required.
 */

import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

function NormalChild({ message }: { message: string }) {
  return <div data-testid="child">{message}</div>;
}

let throwCount = 0;
function CrashingChild(): React.ReactNode {
  throwCount++;
  throw new Error("Kaboom from child");
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function mount(element: React.ReactElement): void {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(element);
  });
}

function unmount(): void {
  if (root) {
    act(() => {
      root!.unmount();
    });
    root = null;
  }
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
}

afterEach(() => {
  unmount();
  throwCount = 0;
});

function findButtonByLabel(text: string): HTMLButtonElement {
  const btn = Array.from(container!.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`Button "${text}" not found in DOM`);
  return btn as HTMLButtonElement;
}

describe("ErrorBoundary", () => {
  it("renders children normally when no error is thrown", () => {
    mount(
      <ErrorBoundary label="Test View">
        <NormalChild message="hello world" />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain("hello world");
    expect(container!.innerHTML).not.toContain("crashed");
    expect(container!.innerHTML).not.toContain("Kaboom from child");
  });

  it("renders the branded fallback when a descendant throws", () => {
    mount(
      <ErrorBoundary label="My View">
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).not.toContain("hello world");
    expect(container!.innerHTML).toContain("My View");
    expect(container!.innerHTML).toContain("crashed");
    expect(container!.innerHTML).toContain("Kaboom from child");
  });

  it("uses 'this view' as the default section label when none is provided", () => {
    mount(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain("this view");
  });

  it("exposes a Retry button in the fallback UI", () => {
    mount(
      <ErrorBoundary label="X">
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain("Retry");
  });

  it("hides the Back-to-Dashboard button when onGoHome is not provided", () => {
    mount(
      <ErrorBoundary label="X">
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).not.toContain("Back to Dashboard");
  });

  it("shows the Back-to-Dashboard button when onGoHome is provided", () => {
    mount(
      <ErrorBoundary label="X" onGoHome={() => undefined}>
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain("Back to Dashboard");
  });

  it("uses the custom renderFallback when provided", () => {
    mount(
      <ErrorBoundary
        label="Custom"
        renderFallback={({ error, reset, goHome }) => (
          <div data-testid="custom-fallback">
            <span>err:{error.message}</span>
            <button onClick={reset}>r</button>
            <button onClick={goHome}>h</button>
          </div>
        )}
      >
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain('data-testid="custom-fallback"');
    expect(container!.innerHTML).toContain("err:Kaboom from child");
    expect(container!.innerHTML).not.toContain("Retry");
  });

  it("data-error-boundary attribute reflects the label for testability", () => {
    mount(
      <ErrorBoundary label="Kanban Board">
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain('data-error-boundary="Kanban Board"');
  });

  it("error details are in a collapsible details/summary block", () => {
    mount(
      <ErrorBoundary label="X">
        <CrashingChild />
      </ErrorBoundary>,
    );
    const html = container!.innerHTML;
    expect(html).toMatch(/<details/);
    expect(html).toMatch(/<summary/);
    expect(html).toContain("Show error details");
  });

  it("Retry button resets error state and re-runs children (re-throws if child still throws)", () => {
    mount(
      <ErrorBoundary label="Reset Test">
        <CrashingChild />
      </ErrorBoundary>,
    );
    expect(container!.innerHTML).toContain("crashed");
    const initialThrowCount = throwCount;
    expect(initialThrowCount).toBeGreaterThan(0);

    const retry = findButtonByLabel("Retry");
    // Wrap click in act so React processes the state update + re-render.
    act(() => {
      retry.click();
    });

    // After click: state was reset (hasError=false), children re-evaluated,
    // CrashingChild threw again, getDerivedStateFromError fired again.
    expect(container!.innerHTML).toContain("crashed");
    expect(container!.innerHTML).toContain("Kaboom from child");
    expect(throwCount).toBeGreaterThan(initialThrowCount);
  });
});
