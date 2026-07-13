/**
 * GraphQL Schema for Todo Elephant
 * Standalone schema string for graphql-http (doesn't require build step)
 */

export const typeDefsString = `
  scalar DateTime

  enum TaskStatus {
    TODO
    IN_PROGRESS
    DONE
    ARCHIVED
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
  }

  enum RecurrenceKind {
    NONE
    DAILY
    WEEKLY
    MONTHLY
  }

  type Subtask {
    id: Int!
    title: String!
    completed: Boolean!
  }

  type Task {
    id: Int!
    title: String!
    description: String!
    dueDate: DateTime!
    priority: Priority!
    status: String!
    subtasks: [Subtask!]!
    listId: Int
    labels: [Int!]!
    dependsOnTaskId: Int
    relatedTaskIds: [Int!]
    isImportant: Boolean
    isUrgent: Boolean
    recurrence: RecurrenceKind
    completedPomodoros: Int
    parentRecurrenceId: Int
    order: Int
    archivedAt: DateTime
    isTemplate: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
    completedAt: DateTime
    timeEstimate: TimeEstimate
    schedulingSuggestion: SchedulingSuggestion
  }

  type TimeEstimate {
    minutes: Int!
    confidence: Float!
    basedOnCount: Int!
  }

  type SchedulingSuggestion {
    suggestedSlots: [TimeSlot!]!
    reasoning: String
    conflicts: [Task!]!
  }

  type TimeSlot {
    start: DateTime!
    end: DateTime!
    label: String
  }

  type List {
    id: Int!
    name: String!
    description: String
    color: String
    createdAt: DateTime!
    taskCount: Int
  }

  type Label {
    id: Int!
    name: String!
    color: String
    taskCount: Int
  }

  type ActivityLog {
    id: Int!
    action: String!
    entityType: String!
    entityId: Int!
    details: String
    previousValue: String
    newValue: String
    createdAt: DateTime!
  }

  type User {
    id: Int!
    name: String!
    email: String!
    createdAt: DateTime!
  }

  type SavedFilter {
    id: Int!
    name: String!
    query: String
    statusFilter: String
    priorityFilter: String
    sortBy: String
  }

  type ShortcutConfig {
    id: String!
    key: String!
    altKey: Boolean
    ctrlKey: Boolean
    metaKey: Boolean
    shiftKey: Boolean
    description: String!
    action: String!
  }

  type FocusSession {
    id: Int!
    taskId: Int!
    startedAt: DateTime!
    endedAt: DateTime
    durationSeconds: Int!
    completedEarly: Boolean!
  }

  type Stats {
    totalTasks: Int!
    completedTasks: Int!
    completionRate: Float!
    currentStreak: Int!
    productivityScore: Float!
  }

  type Query {
    tasks(
      status: String
      priority: String
      listId: Int
      labelId: Int
      search: String
      limit: Int
      offset: Int
    ): [Task!]!

    task(id: Int!): Task

    lists: [List!]!
    list(id: Int!): List

    labels: [Label!]!
    label(id: Int!): Label

    stats: Stats!

    me: User
    savedFilters: [SavedFilter!]!
    activityLogs(limit: Int): [ActivityLog!]!

    schedulingSuggestions(
      taskIds: [Int!]!
      dateRange: DateRangeInput
    ): [SchedulingSuggestion!]!
  }

  input DateRangeInput {
    start: DateTime
    end: DateTime
  }

  input NewTaskInput {
    title: String!
    description: String
    dueDate: DateTime
    priority: Priority
    status: String
    listId: Int
    labels: [Int!]
    dependsOnTaskId: Int
    isImportant: Boolean
    isUrgent: Boolean
    recurrence: RecurrenceKind
    subtasks: [NewSubtaskInput!]
    isTemplate: Boolean
  }

  input NewSubtaskInput {
    title: String!
    completed: Boolean
  }

  input UpdateTaskInput {
    title: String
    description: String
    dueDate: DateTime
    priority: Priority
    status: String
    listId: Int
    labels: [Int!]
    dependsOnTaskId: Int
    isImportant: Boolean
    isUrgent: Boolean
    recurrence: RecurrenceKind
  }

  type Mutation {
    createTask(input: NewTaskInput!): Task!
    updateTask(id: Int!, input: UpdateTaskInput!): Task
    deleteTask(id: Int!): Boolean

    createList(name: String!, color: String): List!
    createLabel(name: String!, color: String): Label!

    saveFilter(name: String!, query: String): SavedFilter!
    deleteFilter(id: Int!): Boolean

    suggestSchedule(taskId: Int!, date: DateTime): SchedulingSuggestion!

    bulkComplete(taskIds: [Int!]!): [Task!]!
    bulkDelete(taskIds: [Int!]!): Int!
  }
`;