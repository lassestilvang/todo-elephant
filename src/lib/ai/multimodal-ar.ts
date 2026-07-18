/**
 * Multimodal AI Integration - AR/VR Support
 * AR overlays for physical task guidance and VR collaborative workspaces
 */

export interface ARTaskOverlay {
  taskId: string;
  title: string;
  position3D: { x: number; y: number; z: number };
  instructions: string[];
  estimatedMinutes: number;
  priority: 'high' | 'medium' | 'low';
  visibilityRange: number; // meters
  anchorType: 'wall' | 'table' | 'floating' | 'ground';
}

export interface VRWorkspaceConfig {
  id: string;
  name: string;
  participants: string[];
  environment: 'office' | 'creative' | 'meeting' | 'focus';
  objects: VRObject[];
  audioEnabled: boolean;
  spatialAudio: boolean;
  sharedBoard: boolean;
  whiteboardMode: boolean;
}

export interface VRObject {
  id: string;
  type: 'task_card' | 'sticky_note' | 'whiteboard' | '3d_model' | 'container';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  content?: string;
  color?: [number, number, number];
  taskId?: string;
  parentId?: string;
  interactive: boolean;
  grabbable: boolean;
}

export interface GestureCommand {
  gesture: string;
  action: string;
  target?: string;
  parameters?: Record<string, any>;
}

export class MultimodalAIService {
  /**
   * Create AR overlay for physical task guidance
   */
  async createAROverlay(taskId: string, position: { x: number; y: number; z: number }): Promise<ARTaskOverlay> {
    const overlay: ARTaskOverlay = {
      taskId,
      title: taskId,
      position3D: position,
      instructions: [],
      estimatedMinutes: 30,
      priority: 'medium',
      visibilityRange: 5,
      anchorType: 'floating',
    };

    // Fetch task details for overlay
    try {
      const taskResponse = await fetch(`/api/tasks/${taskId}`);
      if (taskResponse.ok) {
        const task = await taskResponse.json();
        overlay.title = task.title || taskId;
        overlay.estimatedMinutes = task.estimatedMinutes || 30;
        overlay.priority = task.priority || 'medium';
        overlay.instructions = this.generateARInstructions(task);
      }
    } catch (error) {
      console.error('AR overlay fetch error:', error);
    }

    return overlay;
  }

  /**
   * Create VR collaborative workspace
   */
  async createVRWorkspace(config: {
    name: string;
    participants: string[];
    environment?: 'office' | 'creative' | 'meeting' | 'focus';
    sharedBoard?: boolean;
  }): Promise<VRWorkspaceConfig> {
    const workspace: VRWorkspaceConfig = {
      id: `vr-ws-${Date.now()}`,
      name: config.name,
      participants: config.participants,
      environment: config.environment || 'office',
      objects: [],
      audioEnabled: true,
      spatialAudio: true,
      sharedBoard: config.sharedBoard ?? true,
      whiteboardMode: false,
    };

    // Load environment objects
    workspace.objects = await this.loadEnvironmentObjects(workspace.environment);

    return workspace;
  }

  /**
   * Process gesture commands
   */
  async processGestureCommand(gesture: string, context: any): Promise<GestureCommand | null> {
    const commandMap: Record<string, GestureCommand> = {
      'swipe_right': { gesture: 'swipe_right', action: 'complete_task', target: context.taskId },
      'swipe_left': { gesture: 'swipe_left', action: 'dismiss_task', target: context.taskId },
      'pinch_in': { gesture: 'pinch_in', action: 'zoom_out', target: undefined },
      'pinch_out': { gesture: 'pinch_out', action: 'zoom_in', target: undefined },
      'grab': { gesture: 'grab', action: 'grab_object', parameters: { grabbable: true } },
      'throw': { gesture: 'throw', action: 'drop_task', target: context.targetId },
      'two_finger_tap': { gesture: 'two_finger_tap', action: 'open_details', target: context.taskId },
      'fist': { gesture: 'fist', action: 'confirm', target: context.selectionId },
      'open_palm': { gesture: 'open_palm', action: 'cancel', target: undefined },
      'point': { gesture: 'point', action: 'select', target: context.targetId },
      'wave': { gesture: 'wave', action: 'dismiss_notification', target: context.notificationId },
    };

    return commandMap[gesture] || null;
  }

  /**
   * Generate AR instructions from task text
   */
  private generateARInstructions(task: any): string[] {
    const instructions: string[] = [];

    if (task.title) {
      instructions.push(`Task: ${task.title}`);
    }

    if (task.description) {
      const lines = task.description.split('\n').filter(line => line.trim());
      instructions.push(...lines.slice(0, 3)); // Show first 3 lines
    }

    if (task.dueDate) {
      const daysUntil = Math.ceil(
        (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil > 0) {
        instructions.push(`Due in ${daysUntil} day(s)`);
      } else if (daysUntil === 0) {
        instructions.push('Due today');
      } else {
        instructions.push(`OVERDUE by ${Math.abs(daysUntil)} day(s)`);
      }
    }

    if (task.priority) {
      instructions.push(`Priority: ${task.priority.toUpperCase()}`);
    }

    if (task.estimatedMinutes) {
      instructions.push(`Estimated: ${task.estimatedMinutes} minutes`);
    }

    return instructions;
  }

  /**
   * Load environment-specific 3D objects
   */
  private async loadEnvironmentObjects(env: string): Promise<VRObject[]> {
    const environments: Record<string, VRObject[]> = {
      office: [
        { id: 'desk', type: 'container', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 0.1, z: 1.5 }, interactive: false, grabbable: false },
        { id: 'board', type: 'whiteboard', position: { x: 1, y: 1.5, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.5, y: 1, z: 0.05 }, interactive: true, grabbable: false },
      ],
      creative: [
        { id: 'canvas', type: 'whiteboard', position: { x: 0, y: 1.5, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 1.5, z: 0.05 }, interactive: true, grabbable: false },
        { id: 'palette', type: 'container', position: { x: -1, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.5, y: 0.5, z: 0.5 }, interactive: true, grabbable: true },
      ],
      meeting: [
        { id: 'table', type: 'container', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 3, y: 0.1, z: 2 }, interactive: false, grabbable: false },
        { id: 'screen', type: 'whiteboard', position: { x: 0, y: 2, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 1.5, z: 0.05 }, interactive: true, grabbable: false },
      ],
      focus: [
        { id: 'zen', type: '3d_model', position: { x: 0, y: 1.5, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, content: 'Focus Mode Active', color: [0.1, 0.3, 0.1], interactive: false, grabbable: false },
      ],
    };

    return environments[env] || environments.office;
  }

  /**
   * Check if AR overlay is in visible range
   */
  isOverlayVisible(overlay: ARTaskOverlay, userPosition: { x: number; y: number; z: number }): boolean {
    const dx = overlay.position3D.x - userPosition.x;
    const dy = overlay.position3D.y - userPosition.y;
    const dz = overlay.position3D.z - userPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance <= overlay.visibilityRange;
  }
}

export const multimodalAI = new MultimodalAIService();