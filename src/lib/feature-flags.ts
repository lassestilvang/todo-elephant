/*
 * Feature Flags System for Todo Elephant
 * Provides runtime feature toggling for gradual rollouts and A/B testing
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Feature flag definitions with default values
export interface FeatureFlags {
  // Core features
  darkMode: boolean;
  voiceInput: boolean;
  aiSubtasks: boolean;
  predictiveReminders: boolean;
  habitTracker: boolean;

  // Calendar integrations
  googleCalendar: boolean;
  outlookCalendar: boolean;

  // Collaboration
  taskAssignment: boolean;
  sharedWorkspaces: boolean;

  // Third-party integrations
  slackIntegration: boolean;
  trelloIntegration: boolean;
  notionIntegration: boolean;

  // Accessibility & Performance
  highContrastMode: boolean;
  virtualScrolling: boolean;
  progressiveLoad: boolean;

  // Experimental features
  aiSmartScheduling: boolean;
  naturalLanguageProcessing: boolean;
  offlineMode: boolean;

  // UI enhancements
  keyboardShortcuts: boolean;
  commandPalette: boolean;
  zenMode: boolean;
  focusMode: boolean;
}

// Default feature flags
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  darkMode: true,
  voiceInput: true,
  aiSubtasks: true,
  predictiveReminders: true,
  habitTracker: true,
  googleCalendar: true,
  outlookCalendar: true,
  taskAssignment: true,
  sharedWorkspaces: true,
  slackIntegration: false, // Requires API keys
  trelloIntegration: false, // Requires API keys
  notionIntegration: false, // Requires API keys
  highContrastMode: true,
  virtualScrolling: true,
  progressiveLoad: true,
  aiSmartScheduling: false, // Experimental
  naturalLanguageProcessing: false, // Experimental
  offlineMode: true,
  keyboardShortcuts: true,
  commandPalette: true,
  zenMode: true,
  focusMode: true,
};

// Context for feature flags
const FeatureFlagsContext = createContext<{
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  resetFlags: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}>({
  flags: DEFAULT_FEATURE_FLAGS,
  isEnabled: () => true,
  toggleFlag: () => {},
  setFlag: () => {},
  resetFlags: () => {},
  loadFromStorage: () => {},
  saveToStorage: () => {},
});

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  initialFlags = {},
}) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem('todo-elephant-feature-flags');
    if (stored) {
      try {
        return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) };
      } catch {
        return { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
      }
    }
    return { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
  });

  // Save to localStorage when flags change
  useEffect(() => {
    localStorage.setItem('todo-elephant-feature-flags', JSON.stringify(flags));
  }, [flags]);

  const isEnabled = (flag: keyof FeatureFlags): boolean => flags[flag];

  const toggleFlag = (flag: keyof FeatureFlags) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const setFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({ ...prev, [flag]: value }));
  };

  const resetFlags = () => {
    setFlags(DEFAULT_FEATURE_FLAGS);
  };

  const loadFromStorage = () => {
    const stored = localStorage.getItem('todo-elephant-feature-flags');
    if (stored) {
      try {
        setFlags({ ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) });
      } catch {
        setFlags(DEFAULT_FEATURE_FLAGS);
      }
    }
  };

  const saveToStorage = () => {
    localStorage.setItem('todo-elephant-feature-flags', JSON.stringify(flags));
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        isEnabled,
        toggleFlag,
        setFlag,
        resetFlags,
        loadFromStorage,
        saveToStorage,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// HOC for conditional rendering based on feature flags
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: keyof FeatureFlags,
  fallback?: React.ReactNode
) {
  return function WithFeatureFlagComponent(props: P) {
    const { isEnabled } = useFeatureFlags();

    if (!isEnabled(flag)) {
      return <>{fallback}</>;
    }

    return <Component {...props} />;
  };
}

// Hook for conditional rendering
export function useFeatureFlag(flag: keyof FeatureFlags) {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
}

// Feature flag decorator for API routes
export function withFeatureFlagAPI(flag: keyof FeatureFlags) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // In server-side code, check feature flags from config
      const featureFlags = getServerFeatureFlags();

      if (!featureFlags[flag]) {
        return new Response(
          JSON.stringify({ error: 'Feature not available', feature: flag }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Server-side feature flags (would come from config/database)
function getServerFeatureFlags(): FeatureFlags {
  // In production, this would come from a config service
  return DEFAULT_FEATURE_FLAGS;
}

// Feature flag manager for admin panel
const featureFlagManager = {
  getAllFlags: () => DEFAULT_FEATURE_FLAGS,

  getFlagDescription: (flag: keyof FeatureFlags): string => {
    const descriptions: Record<keyof FeatureFlags, string> = {
      darkMode: 'Enable dark/light theme toggle with system preference detection',
      voiceInput: 'Enable voice-to-text task creation using Web Speech API',
      aiSubtasks: 'Auto-generate subtasks when creating new tasks using AI',
      predictiveReminders: 'Show AI-powered reminder suggestions based on task patterns',
      habitTracker: 'Display habit tracking with streaks and heat map visualization',
      googleCalendar: 'Sync tasks with Google Calendar via OAuth2',
      outlookCalendar: 'Sync tasks with Microsoft Outlook Calendar via Microsoft Graph',
      taskAssignment: 'Allow assigning tasks to team members',
      sharedWorkspaces: 'Enable shared workspaces for team collaboration',
      slackIntegration: 'Post task updates to Slack channels',
      trelloIntegration: 'Sync tasks with Trello boards',
      notionIntegration: 'Sync tasks with Notion databases',
      highContrastMode: 'Enable high contrast mode for accessibility',
      virtualScrolling: 'Use virtual scrolling for large task lists',
      progressiveLoad: 'Progressively load tasks in batches',
      aiSmartScheduling: 'EXPERIMENTAL: AI-powered smart scheduling suggestions',
      naturalLanguageProcessing: 'EXPERIMENTAL: Natural language task creation',
      offlineMode: 'Enable offline support with background sync',
      keyboardShortcuts: 'Enable keyboard shortcuts for power users',
      commandPalette: 'Enable command palette (⌘K) for quick actions',
      zenMode: 'Enable distraction-free zen mode',
      focusMode: 'Enable Pomodoro-style focus sessions',
    };
    return descriptions[flag] || 'No description available';
  },

  getExperimentalFlags: (): (keyof FeatureFlags)[] => [
    'aiSmartScheduling',
    'naturalLanguageProcessing',
  ],

  getRequiresAPIKeys: (): (keyof FeatureFlags)[] => [
    'slackIntegration',
    'trelloIntegration',
    'notionIntegration',
  ],
};

// Feature flag manager for admin panel
export const featureFlagManager = {
  getAllFlags: () => DEFAULT_FEATURE_FLAGS,

  getFlagDescription: (flag: keyof FeatureFlags): string => {
    const descriptions: Record<keyof FeatureFlags, string> = {
      darkMode: 'Enable dark/light theme toggle with system preference detection',
      voiceInput: 'Enable voice-to-text task creation using Web Speech API',
      aiSubtasks: 'Auto-generate subtasks when creating new tasks using AI',
      predictiveReminders: 'Show AI-powered reminder suggestions based on task patterns',
      habitTracker: 'Display habit tracking with streaks and heat map visualization',
      googleCalendar: 'Sync tasks with Google Calendar via OAuth2',
      outlookCalendar: 'Sync tasks with Microsoft Outlook Calendar via Microsoft Graph',
      taskAssignment: 'Allow assigning tasks to team members',
      sharedWorkspaces: 'Enable shared workspaces for team collaboration',
      slackIntegration: 'Post task updates to Slack channels',
      trelloIntegration: 'Sync tasks with Trello boards',
      notionIntegration: 'Sync tasks with Notion databases',
      highContrastMode: 'Enable high contrast mode for accessibility',
      virtualScrolling: 'Use virtual scrolling for large task lists',
      progressiveLoad: 'Progressively load tasks in batches',
      aiSmartScheduling: 'EXPERIMENTAL: AI-powered smart scheduling suggestions',
      naturalLanguageProcessing: 'EXPERIMENTAL: Natural language task creation',
      offlineMode: 'Enable offline support with background sync',
      keyboardShortcuts: 'Enable keyboard shortcuts for power users',
      commandPalette: 'Enable command palette (⌘K) for quick actions',
      zenMode: 'Enable distraction-free zen mode',
      focusMode: 'Enable Pomodoro-style focus sessions',
    };
    return descriptions[flag] || 'No description available';
  },

  getExperimentalFlags: (): (keyof FeatureFlags)[] => [
    'aiSmartScheduling',
    'naturalLanguageProcessing',
  ],

  getRequiresAPIKeys: (): (keyof FeatureFlags)[] => [
    'slackIntegration',
    'trelloIntegration',
    'notionIntegration',
  ],
};