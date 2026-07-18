/**
 * Immersive Productivity Enhancements
 * VR workspaces, ambient environments, immersive focus modes
 */

export interface ImmersiveEnvironment {
  id: string;
  name: string;
  type: 'forest' | 'cafe' | 'library' | 'creative_studio' | 'focus_cave' | 'collaborative_workspace';
  audioAmbience: string[];
  lighting: {
    brightness: number;
    colorTemperature: number;
    accentColor: string;
  };
  visualElements: string[];
  productivityBoost: number; // percentage boost
  focusBonus: number;
  creativityBonus: number;
  bestFor: string[];
  userId?: string;
  isPublic: boolean;
}

export interface VRWorkstationConfig {
  id: string;
  name: string;
  userId: string;
  environmentId: string;
  layout: VRWorkspaceLayout;
  activeTask?: string;
  ambientVolume: number;
  spatialAudio: boolean;
  handTracking: boolean;
  eyeTracking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VRWorkspaceLayout {
  deskPosition: { x: number; y: number; z: number };
  screenPosition: { x: number; y: number; z: number };
  taskListPosition: { x: number; y: number; z: number };
  timerPosition: { x: number; y: number; z: number };
  collaboratorPositions: Array<{ userId: string; position: { x: number; y: number; z: number } }>;
}

export interface AmbientSoundscape {
  type: 'rain' | 'waves' | 'forest' | 'cafe' | 'white_noise' | 'lo_fi' | 'brown_noise';
  volume: number; // 0-1
  fadeIn: boolean;
  loop: boolean;
  bpm?: number; // For rhythmic sounds
  frequencies: { low: number; mid: number; high: number };
}

export interface ImmersiveTaskSession {
  id: string;
  taskId: string;
  environmentId: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  focusScore: number; // 0-100
  interruptions: number;
  completed: boolean;
  notes: string;
  productivityRating: number; // 1-5
}

export class ImmersiveProductivityEngine {
  /**
   * Get recommended environments for a task type
   */
  getRecommendedEnvironments(taskCategory: string): ImmersiveEnvironment[] {
    const recommendations: Record<string, string[]> = {
      'creative': ['creative_studio', 'forest', 'library'],
      'code': ['focus_cave', 'library', 'creative_studio'],
      'writing': ['library', 'forest', 'focus_cave'],
      'meeting': ['collaborative_workspace', 'cafe'],
      'review': ['library', 'focus_cave'],
      'planning': ['creative_studio', 'collaborative_workspace'],
      'learning': ['library', 'forest'],
      'admin': ['cafe', 'library'],
      'default': ['library', 'forest', 'focus_cave'],
    };

    const environmentTypes = recommendations[taskCategory] || recommendations['default'];
    const defaultEnvironments = environmentTypes.map(type => ({
      id: `env-${type}`,
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: type as any,
      audioAmbience: this.getDefaultAudioForType(type),
      lighting: this.getDefaultLightingForType(type),
      visualElements: this.getDefaultVisualsForType(type),
      productivityBoost: 0,
      focusBonus: 0,
      creativityBonus: 0,
      bestFor: [taskCategory],
      isPublic: true,
    }));

    return defaultEnvironments;
  }

  /**
   * Start an immersive task session
   */
  async startImmersiveSession(config: {
    taskId: string;
    environmentId: string;
    userId: string;
  }): Promise<ImmersiveTaskSession> {
    const session: ImmersiveTaskSession = {
      id: `session-${Date.now()}`,
      taskId: config.taskId,
      environmentId: config.environmentId,
      startedAt: new Date(),
      focusScore: 0,
      interruptions: 0,
      completed: false,
      notes: '',
      productivityRating: 0,
    };

    return session;
  }

  /**
   * End an immersive task session
   */
  async endImmersiveSession(sessionId: string, notes?: string): Promise<ImmersiveTaskSession | null> {
    // In a real implementation, this would fetch and update the session
    // For now, return a placeholder session
    const session: ImmersiveTaskSession = {
      id: sessionId,
      taskId: 'active-task',
      environmentId: 'env-focus-cave',
      startedAt: new Date(Date.now() - 25 * 60 * 1000),
      endedAt: new Date(),
      durationMinutes: 25,
      focusScore: 85,
      interruptions: 1,
      completed: true,
      notes: notes || '',
      productivityRating: 4,
    };

    return session;
  }

  /**
   * Calculate focus score based on session metrics
   */
  calculateFocusScore(session: ImmersiveTaskSession): number {
    let score = 100;
    score -= session.interruptions * 10;
    score -= (session.durationMinutes || 0) > 60 ? (session.durationMinutes! - 60) * 0.5 : 0;
    score += session.productivityRating * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate ambient audio configuration
   */
  generateAudioMix(environments: string[]): AmbientSoundscape[] {
    return environments.map(type => {
      const baseConfig = this.getAudioConfigForType(type);
      return {
        ...baseConfig,
        volume: 0.3, // Default low volume
        fadeIn: true,
        loop: true,
      };
    });
  }

  private getDefaultAudioForType(type: string): string[] {
    const map: Record<string, string[]> = {
      'forest': ['forest_birds', 'gentle_wind', 'distant_stream'],
      'cafe': ['cafe_background', 'soft_music', 'distant_conversation'],
      'library': ['quiet_ambient', 'paper_rustling', 'distant_pages'],
      'creative_studio': ['creative_ambient', 'brush_strokes', 'inspiration'],
      'focus_cave': ['deep_cave', 'resonance', 'meditation_drone'],
      'collaborative_workspace': ['team_ambient', 'keyboard_typing', 'collaborative_energy'],
    };
    return map[type] || ['quiet_ambient'];
  }

  private getDefaultLightingForType(type: string): { brightness: number; colorTemperature: number; accentColor: string } {
    const map: Record<string, { brightness: number; colorTemperature: number; accentColor: string }> = {
      'forest': { brightness: 0.7, colorTemperature: 5500, accentColor: '#2d5a27' },
      'cafe': { brightness: 0.8, colorTemperature: 4000, accentColor: '#d4a86a' },
      'library': { brightness: 0.9, colorTemperature: 4500, accentColor: '#8b7355' },
      'creative_studio': { brightness: 0.6, colorTemperature: 6000, accentColor: '#ff6b6b' },
      'focus_cave': { brightness: 0.25, colorTemperature: 3000, accentColor: '#4a4a8a' },
      'collaborative_workspace': { brightness: 0.75, colorTemperature: 5000, accentColor: '#5a9fd4' },
    };
    return map[type] || { brightness: 0.7, colorTemperature: 4500, accentColor: '#ffffff' };
  }

  private getDefaultVisualsForType(type: string): string[] {
    const map: Record<string, string[]> = {
      'forest': ['trees', 'mountain_range', 'sunlight_beams', 'mist'],
      'cafe': ['warm_lamps', 'coffee_cups', 'bookshelves', 'window_light'],
      'library': ['book_filled_shelves', 'reading_lamp', 'quiet_corner', 'ancient_elements'],
      'creative_studio': ['canvas', 'easel', 'paint_palette', 'creative_scribbles'],
      'focus_cave': ['crystals', 'floating_geometry', 'soft_glow', 'minimal_elements'],
      'collaborative_workspace': ['shared_desk', 'whiteboard', 'sticky_notes', 'teaming_elements'],
    };
    return map[type] || ['minimal', 'clean', 'focused'];
  }

  private getAudioConfigForType(type: string): AmbientSoundscape {
    const map: Record<string, AmbientSoundscape> = {
      'forest': { type: 'forest', volume: 0.3, fadeIn: true, loop: true, bpm: 0 },
      'cafe': { type: 'cafe', volume: 0.3, fadeIn: true, loop: true, bpm: 100 },
      'library': { type: 'brown_noise', volume: 0.2, fadeIn: true, loop: true },
      'creative_studio': { type: 'lo_fi', volume: 0.25, fadeIn: true, loop: true, bpm: 85 },
      'focus_cave': { type: 'white_noise', volume: 0.15, fadeIn: true, loop: true },
      'collaborative_workspace': { type: 'brown_noise', volume: 0.2, fadeIn: true, loop: true },
    };
    return map[type] || { type: 'brown_noise', volume: 0.2, fadeIn: true, loop: true };
  }
}

export const immersiveProductivity = new ImmersiveProductivityEngine();