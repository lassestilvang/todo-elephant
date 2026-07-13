import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLEnumType, GraphQLInputObjectType, GraphQLScalarType } from "graphql";
import { readDB, mutateDB, nextTaskId, nextListId, nextLabelId, nextFilterId, logActivity } from "@/app/lib/db";
import type { Task, List, Label, FocusSession } from "@/types";
import { calculateTimeEstimate } from "./timeEstimate";
import { isCompletedStatus } from "./status";
import { dayKey } from "./dateUtils";

// DateTime scalar
const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO 8601 DateTime",
  parseValue(value) {
    return new Date(value as string);
  },
  serialize(value) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseLiteral(ast) {
    if (ast.kind === "StringValue") return new Date(ast.value);
    return null;
  },
});

// Import typeDefsString
export { typeDefsString } from "./graphql-schema";

// Enums
const TaskStatusEnum = new GraphQLEnumType({
  name: "TaskStatus",
  values: {
    TODO: { value: "todo" },
    IN_PROGRESS: { value: "in_progress" },
    DONE: { value: "done" },
    ARCHIVED: { value: "archived" },
  },
});

const PriorityEnum = new GraphQLEnumType({
  name: "Priority",
  values: {
    LOW: { value: "low" },
    MEDIUM: { value: "medium" },
    HIGH: { value: "high" },
  },
});

const RecurrenceKindEnum = new GraphQLEnumType({
  name: "RecurrenceKind",
  values: {
    NONE: { value: "none" },
    DAILY: { value: "daily" },
    WEEKLY: { value: "weekly" },
    MONTHLY: { value: "monthly" },
  },
});

// Types
const SubtaskType = new GraphQLObjectType({
  name: "Subtask",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    completed: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

const TimeEstimateType = new GraphQLObjectType({
  name: "TimeEstimate",
  fields: {
    minutes: { type: new GraphQLNonNull(GraphQLInt) },
    confidence: { type: new GraphQLNonNull(GraphQLFloat) },
    basedOnCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

const TimeSlotType = new GraphQLObjectType({
  name: "TimeSlot",
  fields: {
    start: { type: new GraphQLNonNull(DateTimeScalar) },
    end: { type: new GraphQLNonNull(DateTimeScalar) },
    label: { type: GraphQLString },
  },
});

const SchedulingSuggestionType = new GraphQLObjectType({
  name: "SchedulingSuggestion",
  fields: {
    suggestedSlots: { type: new GraphQLList(TimeSlotType) },
    reasoning: { type: GraphQLString },
    conflicts: { type: new GraphQLList(TaskType) },
  },
});

const TaskType = new GraphQLObjectType({
  name: "Task",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: new GraphQLNonNull(GraphQLString) },
    dueDate: { type: new GraphQLNonNull(DateTimeScalar) },
    priority: { type: new GraphQLNonNull(PriorityEnum) },
    status: { type: new GraphQLNonNull(GraphQLString) },
    subtasks: { type: new GraphQLNonNull(new GraphQLList(SubtaskType)) },
    listId: { type: GraphQLInt },
    labels: { type: new GraphQLList(GraphQLInt) },
    dependsOnTaskId: { type: GraphQLInt },
    relatedTaskIds: { type: new GraphQLList(GraphQLInt) },
    isImportant: { type: GraphQLBoolean },
    isUrgent: { type: GraphQLBoolean },
    recurrence: { type: RecurrenceKindEnum },
    completedPomodoros: { type: GraphQLInt },
    parentRecurrenceId: { type: GraphQLInt },
    order: { type: GraphQLInt },
    archivedAt: { type: DateTimeScalar },
    isTemplate: { type: GraphQLBoolean },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    completedAt: { type: DateTimeScalar },
    timeEstimate: {
      type: TimeEstimateType,
      resolve: (parent: Task) => {
        // Get focus sessions from the DB for time estimate calculation
        return null; // Will be populated by parent resolver
      },
    },
    schedulingSuggestion: {
      type: SchedulingSuggestionType,
      resolve: (parent: Task, _args, context) => {
        return context.suggestScheduleForTask(parent);
      },
    },
  },
});

const ListType = new GraphQLObjectType({
  name: "List",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    color: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    taskCount: {
      type: GraphQLInt,
      resolve: (parent: List, _args, context) => {
        return context.taskCounts?.[parent.id] ?? 0;
      },
    },
  },
});

const LabelType = new GraphQLObjectType({
  name: "Label",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    color: { type: GraphQLString },
    taskCount: {
      type: GraphQLInt,
      resolve: (parent: Label, _args, context) => {
        return context.labelTaskCounts?.[parent.id] ?? 0;
      },
    },
  },
});

const StatsType = new GraphQLObjectType({
  name: "Stats",
  fields: {
    totalTasks: { type: new GraphQLNonNull(GraphQLInt) },
    completedTasks: { type: new GraphQLNonNull(GraphQLInt) },
    completionRate: { type: new GraphQLNonNull(GraphQLFloat) },
    currentStreak: { type: new GraphQLNonNull(GraphQLInt) },
    productivityScore: { type: new GraphQLNonNull(GraphQLFloat) },
  },
});

const ActivityLogType = new GraphQLObjectType({
  name: "ActivityLog",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    action: { type: new GraphQLNonNull(GraphQLString) },
    entityType: { type: new GraphQLNonNull(GraphQLString) },
    entityId: { type: new GraphQLNonNull(GraphQLInt) },
    details: { type: GraphQLString },
    previousValue: { type: GraphQLString },
    newValue: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  },
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  },
});

const SavedFilterType = new GraphQLObjectType({
  name: "SavedFilter",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    query: { type: GraphQLString },
    statusFilter: { type: GraphQLString },
    priorityFilter: { type: GraphQLString },
    sortBy: { type: GraphQLString },
  },
});

const FocusSessionType = new GraphQLObjectType({
  name: "FocusSession",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLInt) },
    taskId: { type: new GraphQLNonNull(GraphQLInt) },
    startedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    endedAt: { type: DateTimeScalar },
    durationSeconds: { type: new GraphQLNonNull(GraphQLInt) },
    completedEarly: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
});

// Input types
const NewSubtaskInputType = new GraphQLInputObjectType({
  name: "NewSubtaskInput",
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    completed: { type: GraphQLBoolean },
  },
});

const NewTaskInputType = new GraphQLInputObjectType({
  name: "NewTaskInput",
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    dueDate: { type: DateTimeScalar },
    priority: { type: PriorityEnum },
    status: { type: GraphQLString },
    listId: { type: GraphQLInt },
    labels: { type: new GraphQLList(GraphQLInt) },
    dependsOnTaskId: { type: GraphQLInt },
    isImportant: { type: GraphQLBoolean },
    isUrgent: { type: GraphQLBoolean },
    recurrence: { type: RecurrenceKindEnum },
    subtasks: { type: new GraphQLList(NewSubtaskInputType) },
    isTemplate: { type: GraphQLBoolean },
  },
});

const UpdateTaskInputType = new GraphQLInputObjectType({
  name: "UpdateTaskInput",
  fields: {
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    dueDate: { type: DateTimeScalar },
    priority: { type: PriorityEnum },
    status: { type: GraphQLString },
    listId: { type: GraphQLInt },
    labels: { type: new GraphQLList(GraphQLInt) },
    dependsOnTaskId: { type: GraphQLInt },
    isImportant: { type: GraphQLBoolean },
    isUrgent: { type: GraphQLBoolean },
    recurrence: { type: RecurrenceKindEnum },
  },
});

// Query type
const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    tasks: {
      type: new GraphQLList(TaskType),
      args: {
        status: { type: GraphQLString },
        priority: { type: GraphQLString },
        listId: { type: GraphQLInt },
        labelId: { type: GraphQLInt },
        search: { type: GraphQLString },
        limit: { type: GraphQLInt },
        offset: { type: GraphQLInt },
      },
      resolve: async (_parent, args) => {
        const db = await readDB();
        let tasks = [...db.tasks];

        if (args.status) {
          tasks = tasks.filter(t => t.status === args.status);
        }
        if (args.priority) {
          tasks = tasks.filter(t => t.priority === args.priority);
        }
        if (args.listId) {
          tasks = tasks.filter(t => t.listId === args.listId);
        }
        if (args.labelId) {
          tasks = tasks.filter(t => t.labels?.includes(args.labelId));
        }
        if (args.search) {
          const searchLower = args.search.toLowerCase();
          tasks = tasks.filter(t =>
            t.title.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower)
          );
        }

        // Sort by ID descending (newest first)
        tasks.sort((a, b) => b.id - a.id);

        if (args.offset) {
          tasks = tasks.slice(args.offset);
        }
        if (args.limit) {
          tasks = tasks.slice(0, args.limit);
        }

        return tasks;
      },
    },
    task: {
      type: TaskType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, { id }) => {
        const db = await readDB();
        return db.tasks.find(t => t.id === id) ?? null;
      },
    },
    lists: {
      type: new GraphQLList(ListType),
      resolve: async () => {
        const db = await readDB();
        return db.lists;
      },
    },
    list: {
      type: ListType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, { id }) => {
        const db = await readDB();
        return db.lists.find(l => l.id === id) ?? null;
      },
    },
    labels: {
      type: new GraphQLList(LabelType),
      resolve: async () => {
        const db = await readDB();
        return db.labels;
      },
    },
    label: {
      type: LabelType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, { id }) => {
        const db = await readDB();
        return db.labels.find(l => l.id === id) ?? null;
      },
    },
    stats: {
      type: StatsType,
      resolve: async () => {
        const db = await readDB();
        const totalTasks = db.tasks.length;
        const completedTasks = db.tasks.filter(isCompletedStatus).length;

        // Calculate streak
        const completedDates = db.tasks
          .filter(isCompletedStatus)
          .map(t => (t.completedAt ?? t.dueDate ?? t.createdAt)?.split("T")[0])
          .filter(Boolean);
        const uniqueDates = [...new Set(completedDates)].sort((a, b) => (a < b ? 1 : -1));

        let streak = 0;
        const today = dayKey(new Date().toISOString());
        const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());

        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1]);
            const curr = new Date(uniqueDates[i]);
            if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
              streak++;
            } else {
              break;
            }
          }
        }

        return {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
          currentStreak: streak,
          productivityScore: completedTasks * 10 + streak * 5,
        };
      },
    },
    me: {
      type: UserType,
      resolve: async () => {
        const db = await readDB();
        return db.currentUser;
      },
    },
    savedFilters: {
      type: new GraphQLList(SavedFilterType),
      resolve: async () => {
        const db = await readDB();
        return db.savedFilters;
      },
    },
    activityLogs: {
      type: new GraphQLList(ActivityLogType),
      args: {
        limit: { type: GraphQLInt },
      },
      resolve: async (_parent, { limit }) => {
        const db = await readDB();
        let logs = [...db.activityLogs];
        if (limit) {
          logs = logs.slice(0, limit);
        }
        return logs;
      },
    },
    schedulingSuggestions: {
      type: new GraphQLList(SchedulingSuggestionType),
      args: {
        taskIds: { type: new GraphQLNonNull(new GraphQLList(GraphQLInt)) },
        dateRange: {
          type: new GraphQLInputObjectType({
            name: "DateRangeInput",
            fields: {
              start: { type: DateTimeScalar },
              end: { type: DateTimeScalar },
            },
          }),
        },
      },
      resolve: async (_parent, { taskIds }, context) => {
        const db = await readDB();
        return taskIds.map(taskId => {
          const task = db.tasks.find(t => t.id === taskId);
          if (!task) return null;
          return generateSchedulingSuggestion(task, db.tasks, db.focusSessions);
        }).filter(Boolean);
      },
    },
  },
});

// Mutation type
const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createTask: {
      type: TaskType,
      args: {
        input: { type: new GraphQLNonNull(NewTaskInputType) },
      },
      resolve: async (_parent, { input }) => {
        const db = await readDB();
        const now = new Date().toISOString();
        const newTask: Task = {
          id: nextTaskId(db),
          title: input.title,
          description: (input.description ?? "").toString().trim(),
          dueDate: input.dueDate?.toISOString() ?? now,
          priority: input.priority ?? "medium",
          status: input.status ?? "todo",
          subtasks: (input.subtasks ?? []).map((s, idx) => ({
            id: idx + 1000,
            title: s.title,
            completed: s.completed ?? false,
          })),
          listId: input.listId,
          labels: input.labels ?? [],
          dependsOnTaskId: input.dependsOnTaskId ?? null,
          isImportant: input.isImportant ?? false,
          isUrgent: input.isUrgent ?? false,
          recurrence: input.recurrence ?? "none",
          completedPomodoros: 0,
          parentRecurrenceId: null,
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
        };

        await mutateDB((db) => {
          db.tasks.push(newTask);
        });

        await logActivity(`Created task "${newTask.title}"`, "task", newTask.id);
        return newTask;
      },
    },
    updateTask: {
      type: TaskType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        input: { type: new GraphQLNonNull(UpdateTaskInputType) },
      },
      resolve: async (_parent, { id, input }) => {
        const result = await mutateDB<Task | null>((db) => {
          const idx = db.tasks.findIndex(t => t.id === id);
          if (idx === -1) return null;
          const original = db.tasks[idx];
          const updated: Task = {
            ...original,
            ...input,
            id: original.id,
            createdAt: original.createdAt,
            updatedAt: new Date().toISOString(),
          };
          db.tasks[idx] = updated;
          return updated;
        });

        if (result) {
          await logActivity(`Updated task "${result.title}"`, "task", result.id);
        }
        return result;
      },
    },
    deleteTask: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, { id }) => {
        const removed = await mutateDB<Task | null>((db) => {
          const idx = db.tasks.findIndex(t => t.id === id);
          if (idx === -1) return null;
          const [task] = db.tasks.splice(idx, 1);
          return task ?? null;
        });

        if (removed) {
          await logActivity(`Deleted task "${removed.title}"`, "task", id);
          return true;
        }
        return false;
      },
    },
    createList: {
      type: ListType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        color: { type: GraphQLString },
      },
      resolve: async (_parent, { name, color }) => {
        const now = new Date().toISOString();
        const result = await mutateDB<List>((db) => {
          const newList: List = {
            id: nextListId(db),
            name,
            color: color ?? "#3b82f6",
            createdAt: now,
          };
          db.lists.push(newList);
          return newList;
        });
        await logActivity(`Created list "${name}"`, "list", result.id);
        return result;
      },
    },
    createLabel: {
      type: LabelType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        color: { type: GraphQLString },
      },
      resolve: async (_parent, { name, color }) => {
        const now = new Date().toISOString();
        const result = await mutateDB<Label>((db) => {
          const newLabel: Label = {
            id: nextLabelId(db),
            name,
            color: color ?? "#3b82f6",
            createdAt: now,
          };
          db.labels.push(newLabel);
          return newLabel;
        });
        await logActivity(`Created label "${name}"`, "label", result.id);
        return result;
      },
    },
    saveFilter: {
      type: SavedFilterType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        query: { type: GraphQLString },
      },
      resolve: async (_parent, { name, query }) => {
        const now = new Date().toISOString();
        const result = await mutateDB((db) => {
          const newFilter = {
            id: nextFilterId(db),
            name,
            query: query ?? "",
            statusFilter: "all",
            priorityFilter: "all",
            sortBy: "newest",
          };
          db.savedFilters.push(newFilter);
          return newFilter;
        });
        return result;
      },
    },
    deleteFilter: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (_parent, { id }) => {
        const removed = await mutateDB((db) => {
          const idx = db.savedFilters.findIndex(f => f.id === id);
          if (idx === -1) return false;
          db.savedFilters.splice(idx, 1);
          return true;
        });
        return removed;
      },
    },
    suggestSchedule: {
      type: SchedulingSuggestionType,
      args: {
        taskId: { type: new GraphQLNonNull(GraphQLInt) },
        date: { type: DateTimeScalar },
      },
      resolve: async (_parent, { taskId }) => {
        const db = await readDB();
        const task = db.tasks.find(t => t.id === taskId);
        if (!task) return null;
        return generateSchedulingSuggestion(task, db.tasks, db.focusSessions);
      },
    },
    bulkComplete: {
      type: new GraphQLList(TaskType),
      args: {
        taskIds: { type: new GraphQLNonNull(new GraphQLList(GraphQLInt)) },
      },
      resolve: async (_parent, { taskIds }) => {
        const results = await mutateDB<Task[]>((db) => {
          return taskIds.map(taskId => {
            const idx = db.tasks.findIndex(t => t.id === taskId);
            if (idx === -1) return null;
            const task = db.tasks[idx];
            const updated = {
              ...task,
              status: "completed",
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            db.tasks[idx] = updated;
            return updated;
          }).filter(Boolean) as Task[];
        });
        return results;
      },
    },
    bulkDelete: {
      type: GraphQLInt,
      args: {
        taskIds: { type: new GraphQLNonNull(new GraphQLList(GraphQLInt)) },
      },
      resolve: async (_parent, { taskIds }) => {
        const count = await mutateDB<number>((db) => {
          let deleted = 0;
          for (const taskId of taskIds) {
            const idx = db.tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) {
              db.tasks.splice(idx, 1);
              deleted++;
            }
          }
          return deleted;
        });
        return count;
      },
    },
  },
});

// Helper function to generate scheduling suggestions
function generateSchedulingSuggestion(
  task: Task,
  allTasks: Task[],
  focusSessions: FocusSession[],
): { suggestedSlots: { start: Date; end: Date; label?: string }[]; reasoning: string; conflicts: Task[] } {
  const estimate = calculateTimeEstimate(task, focusSessions, allTasks);

  if (!estimate) {
    // No time estimate, suggest based on priority
    const slots = getDefaultSlots(task.priority);
    return {
      suggestedSlots: slots,
      reasoning: "No historical data available. Suggested slots based on priority.",
      conflicts: [],
    };
  }

  // Find conflicts (overlapping tasks)
  const taskStart = new Date(task.dueDate);
  const taskEnd = new Date(taskStart.getTime() + estimate.minutes * 60000);

  const conflicts = allTasks.filter(t => {
    if (t.id === task.id || t.status === "completed" || t.status === "done") return false;
    if (!t.dueDate) return false;
    const tStart = new Date(t.dueDate);
    const tEnd = new Date(tStart.getTime() + 60 * 60000); // Assume 1hr for comparison
    return taskStart < tEnd && taskEnd > tStart;
  });

  // Generate smart suggestions based on estimate
  const slots = getOptimalSlots(estimate.minutes, task.priority);

  return {
    suggestedSlots: slots,
    reasoning: `Estimated ${estimate.minutes} minutes based on ${estimate.basedOnCount} similar task(s). Confidence: ${(estimate.confidence * 100).toFixed(0)}%`,
    conflicts,
  };
}

function getDefaultSlots(priority: string): { start: Date; end: Date; label?: string }[] {
  const now = new Date();
  const slots = [];

  if (priority === "high") {
    // High priority: suggest next available slot
    const nextHour = new Date(now.getTime() + 60 * 60000);
    slots.push({
      start: nextHour,
      end: new Date(nextHour.getTime() + 25 * 60000),
      label: "Next available",
    });
  } else {
    // Medium/low: suggest today/tomorrow
    const today = new Date(now);
    today.setHours(14, 0, 0, 0);
    slots.push({ start: today, end: new Date(today.getTime() + 60 * 60000), label: "Today afternoon" });

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    slots.push({ start: tomorrow, end: new Date(tomorrow.getTime() + 60 * 60000), label: "Tomorrow" });
  }

  return slots;
}

function getOptimalSlots(minutes: number, priority: string): { start: Date; end: Date; label?: string }[] {
  const slots = [];
  const now = new Date();

  // Find next good slot (avoid early morning and late evening)
  let slot = new Date(now);
  slot.setHours(Math.max(9, slot.getHours() + 1), 0, 0, 0);

  // High priority items get today's slots
  if (priority === "high") {
    slots.push({
      start: slot,
      end: new Date(slot.getTime() + minutes * 60000),
      label: "Soon",
    });
  }

  // Additional suggestions for optimal focus times
  const tomorrow = new Date(slot);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  slots.push({
    start: tomorrow,
    end: new Date(tomorrow.getTime() + minutes * 60000),
    label: "Tomorrow morning",
  });

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  dayAfter.setHours(14, 0, 0, 0);
  slots.push({
    start: dayAfter,
    end: new Date(dayAfter.getTime() + minutes * 60000),
    label: "Afternoon block",
  });

  return slots;
}

// Export the schema
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});