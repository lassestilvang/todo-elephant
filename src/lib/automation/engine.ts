/**
 * Advanced Automation Hub
 * Visual workflow builder, automation rules, and event-driven architecture
 */

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  conditions?: AutomationCondition[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  executionCount: number;
  successRate: number;
  ownerId?: string;
  tags: string[];
  version: number;
}

export interface AutomationTrigger {
  type: 'task_created' | 'task_completed' | 'task_updated' | 'deadline_approaching' | 'time_based' | 'pattern_detected' | 'webhook' | 'manual';
  conditions: AutomationCondition[];
  schedule?: string; // cron expression for time_based triggers
  webhookUrl?: string;
}

export interface AutomationAction {
  type: 'create_task' | 'update_task' | 'delete_task' | 'move_task' | 'assign_task' | 'send_notification' | 'send_email' | 'create_event' | 'run_script' | 'call_webhook' | 'add_label' | 'remove_label' | 'set_priority' | 'log_event';
  parameters: Record<string, any>;
  target?: string; // Optional target identifier
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: any;
  andOr?: 'and' | 'or';
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'branch' | 'parallel';
  position: { x: number; y: number };
  data: Partial<AutomationTrigger | AutomationAction | AutomationCondition>;
  connections: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Array<{
    fromNodeId: string;
    toNodeId: string;
    condition?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  tags: string[];
  executionHistory: WorkflowExecution[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  triggeredBy: string;
  actionsExecuted: string[];
  errors: Array<{
    actionId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface AutomationMarketplaceItem {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  tags: string[];
  code: string; // The actual automation code/logic
  configurationSchema?: Record<string, any>;
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private marketplace: Map<string, AutomationMarketplaceItem> = new Map();

  /**
   * Create a new automation rule
   */
  createRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successRate' | 'version'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successRate: 100,
      version: 1,
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Create a new workflow
   */
  createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionHistory'>): Workflow {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionHistory: [],
    };

    this.workflows.set(newWorkflow.id, newWorkflow);
    return newWorkflow;
  }

  /**
   * Evaluate and execute rules based on events
   */
  async evaluateRules(event: {
    type: string;
    data: any;
    userId?: string;
  }): Promise<WorkflowExecution[]> {
    const executions: WorkflowExecution[] = [];

    for (const [, rule] of this.rules) {
      if (!rule.isActive) continue;

      // Check if trigger matches event
      if (this.matchesTrigger(rule.trigger, event)) {
        // Check conditions
        if (this.evaluateConditions(rule.conditions || [], event.data)) {
          // Execute actions
          const execution = await this.executeActions(rule, event);
          executions.push(execution);
        }
      }
    }

    return executions;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, triggerData: any): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow is not active: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      startedAt: new Date(),
      triggeredBy: triggerData.userId || 'system',
      actionsExecuted: [],
      errors: [],
    };

    try {
      // Execute nodes in order
      for (const node of workflow.nodes) {
        if (node.type === 'action') {
          const action = node.data as AutomationAction;
          await this.executeSingleAction(action, triggerData);
          execution.actionsExecuted.push(node.id);
        }
      }

      execution.completedAt = new Date();
      execution.status = 'completed';
    } catch (error) {
      execution.completedAt = new Date();
      execution.status = 'failed';
      execution.errors.push({
        actionId: 'execution',
        error: String(error),
        timestamp: new Date(),
      });
    }

    // Record execution
    workflow.executionHistory.push(execution);
    this.workflows.set(workflowId, workflow);

    return execution;
  }

  /**
   * Install marketplace automation
   */
  async installMarketplaceItem(itemId: string, config: Record<string, any>): Promise<AutomationRule | Workflow> {
    const item = this.marketplace.get(itemId);
    if (!item) {
      throw new Error(`Marketplace item not found: ${itemId}`);
    }

    // Parse and instantiate the automation
    // In a real implementation, this would evaluate the code in a sandboxed environment
    const parsed = this.parseAutomationCode(item.code, config);

    if (parsed.type === 'rule') {
      const rule = this.createRule(parsed.rule!);
      return rule;
    } else if (parsed.type === 'workflow') {
      const workflow = this.createWorkflow(parsed.workflow!);
      return workflow;
    }

    throw new Error('Invalid marketplace item type');
  }

  /**
   * Get all active rules
   */
  getActiveRules(): AutomationRule[] {
    return Array.from(this.rules.values()).filter(r => r.isActive);
  }

  /**
   * Get all active workflows
   */
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.workflows.values()).filter(w => w.isActive);
  }

  /**
   * Get marketplace items
   */
  getMarketplaceItems(tags?: string[]): AutomationMarketplaceItem[] {
    const items = Array.from(this.marketplace.values());
    if (tags && tags.length > 0) {
      return items.filter(item => tags.some(t => item.tags.includes(t)));
    }
    return items;
  }

  /**
   * Record marketplace item
   */
  recordMarketplaceItem(item: AutomationMarketplaceItem): void {
    this.marketplace.set(item.id, item);
  }

  private matchesTrigger(trigger: AutomationTrigger, event: { type: string; data: any }): boolean {
    if (trigger.type === event.type) {
      return this.evaluateConditions(trigger.conditions, event.data);
    }
    return false;
  }

  private evaluateConditions(conditions: AutomationCondition[], data: any): boolean {
    if (!conditions || conditions.length === 0) return true;

    // Group by and/or
    const andConditions: AutomationCondition[] = [];
    const orConditions: AutomationCondition[] = [];

    conditions.forEach((condition, index) => {
      if (index > 0 && conditions[index - 1].andOr === 'or') {
        orConditions.push(condition);
      } else {
        andConditions.push(condition);
      }
    });

    const andResult = andConditions.every(c => this.evaluateCondition(c, data));
    const orResult = orConditions.length === 0 || orConditions.some(c => this.evaluateCondition(c, data));

    return andResult && orResult;
  }

  private evaluateCondition(condition: AutomationCondition, data: any): boolean {
    const value = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case 'equals': return value === condition.value;
      case 'not_equals': return value !== condition.value;
      case 'contains': return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains': return !String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than': return Number(value) > Number(condition.value);
      case 'less_than': return Number(value) < Number(condition.value);
      case 'in': return Array.isArray(value) ? condition.value.includes(value) : false;
      case 'not_in': return Array.isArray(value) ? !condition.value.includes(value) : true;
      case 'is_empty': return value === null || value === undefined || value === '';
      case 'is_not_empty': return value !== null && value !== undefined && value !== '';
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executeActions(rule: AutomationRule, event: any): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: rule.id,
      startedAt: new Date(),
      triggeredBy: event.userId || 'system',
      actionsExecuted: [],
      errors: [],
    };

    try {
      for (const action of rule.actions) {
        await this.executeSingleAction(action, event.data);
        execution.actionsExecuted.push(action.type);
      }

      execution.completedAt = new Date();
      execution.status = 'completed';

      // Update rule stats
      rule.executionCount++;
      rule.lastTriggered = new Date();
      rule.successRate = Math.round((rule.successRate * (rule.executionCount - 1) + 100) / rule.executionCount);
      this.rules.set(rule.id, rule);
    } catch (error) {
      execution.completedAt = new Date();
      execution.status = 'failed';
      execution.errors.push({
        actionId: 'execution',
        error: String(error),
        timestamp: new Date(),
      });
    }

    return execution;
  }

  private async executeSingleAction(action: AutomationAction, data: any): Promise<void> {
    switch (action.type) {
      case 'create_task':
        await this.createTask(action.parameters);
        break;
      case 'send_notification':
        await this.sendNotification(action.parameters);
        break;
      case 'update_task':
        await this.updateTask(action.parameters, data);
        break;
      case 'assign_task':
        await this.assignTask(action.parameters);
        break;
      case 'call_webhook':
        await this.callWebhook(action.parameters);
        break;
      default:
        // Placeholder for other action types
      console.log(`Action ${action.type} executed with parameters:`, action.parameters);
    }
  }

  private async createTask(params: Record<string, any>): Promise<void> {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  private async sendNotification(params: Record<string, any>): Promise<void> {
    // Placeholder - would integrate with notification system
    console.log('Notification:', params.message);
  }

  private async updateTask(params: Record<string, any>, context: any): Promise<void> {
    const taskId = params.taskId || context.taskId;
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  private async assignTask(params: Record<string, any>): Promise<void> {
    const taskId = params.taskId;
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: params.assigneeId }),
    });
  }

  private async callWebhook(params: Record<string, any>): Promise<void> {
    await fetch(params.url, {
      method: params.method || 'POST',
      headers: params.headers || {},
      body: JSON.stringify(params.payload || {}),
    });
  }

  private parseAutomationCode(code: string, config: Record<string, any>): { type: 'rule' | 'workflow'; rule?: AutomationRule; workflow?: Workflow } {
    // In real implementation, would parse JSON configuration
    try {
      const parsed = JSON.parse(code);
      if (parsed.trigger && parsed.actions) {
        return { type: 'rule', rule: parsed };
      } else if (parsed.nodes && parsed.connections) {
        return { type: 'workflow', workflow: parsed };
      }
    } catch (e) {
      // Invalid JSON
    }
    throw new Error('Invalid automation code');
  }
}

// Singleton instance
export const automationEngine = new AutomationEngine();