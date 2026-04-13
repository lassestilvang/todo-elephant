import { type ReactNode, createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, subDays, subWeeks, subMonths, addDays, addWeeks, addMonths, isSameDay, isWithinInterval, isAfter, isEqual } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Calendar as CalendarIcon, Clock, Tag, CheckCircle, AlertCircle, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'

type Priority = 'low' | 'medium' | 'high' | 'urgent'
type Status = 'todo' | 'in-progress' | 'done' | 'blocked'
type ViewMode = 'today' | 'next7' | 'upcoming' | 'all'

interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  status: Status
  dueDate?: Date
  category?: string
  createdAt: Date
  completedAt?: Date
}

interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  getTasksByView: (view: ViewMode) => Task[]
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete project documentation',
      description: 'Write API documentation and user guide',
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date('2026-04-15'),
      category: 'Work',
      createdAt: new Date('2026-04-10'),
    },
    {
      id: '2',
      title: 'Team meeting',
      description: 'Weekly team sync and planning',
      priority: 'medium',
      status: 'todo',
      dueDate: new Date('2026-04-14'),
      category: 'Personal',
      createdAt: new Date('2026-04-08'),
    },
    {
      id: '3',
      title: 'Learn TypeScript generics',
      description: 'Deep dive into advanced TypeScript concepts',
      priority: 'low',
      status: 'todo',
      dueDate: new Date('2026-04-20'),
      category: 'Learning',
      createdAt: new Date('2026-04-05'),
    },
  ])

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [{
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    } as Task, ...prev])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, ...updates } : task
    ))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id
        ? { ...task, status: 'done', completedAt: new Date() }
        : task
    ))
  }, [])

  const getTasksByView = useCallback((view: ViewMode) => {
    const today = startOfDay(new Date())
    const next7Days = eachDayOfInterval({ start: today, end: addDays(today, 6) })
    const upcomingStart = addDays(today, 8)
    const upcomingEnd = addMonths(today, 3)

    return tasks.filter(task => {
      switch (view) {
        case 'today':
          return task.dueDate && isSameDay(task.dueDate, today)
        case 'next7':
          return task.dueDate && isWithinInterval(task.dueDate, { start: today, end: addDays(today, 6) })
        case 'upcoming':
          return task.dueDate && isAfter(task.dueDate, upcomingStart) && isWithinInterval(task.dueDate, { start: upcomingStart, end: upcomingEnd })
        case 'all':
          return true
        default:
          return true
      }
    }).sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      const statusOrder: Record<Status, number> = { 'in-progress': 0, todo: 1, done: 2, blocked: 3 }
      
      if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority]
      if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status]
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }, [tasks])

  const value = useMemo(() => ({
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    getTasksByView,
  }), [tasks, addTask, updateTask, deleteTask, completeTask])

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within TaskProvider')
  }
  return context
}

// Sidebar Component
export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tasks } = useTasks()

  const views = [
    { id: 'today', label: 'Today', icon: CalendarIcon, count: tasks.filter(t => t.dueDate && isSameDay(t.dueDate, new Date())).length },
    { id: 'next7', label: 'Next 7 Days', icon: Calendar, count: tasks.filter(t => t.dueDate && isWithinInterval(t.dueDate, {
      start: startOfDay(new Date()),
      end: addDays(startOfDay(new Date()), 6)
    })).length },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: tasks.filter(t => t.dueDate && isAfter(t.dueDate, addDays(startOfDay(new Date()), 7))).length },
    { id: 'all', label: 'All Tasks', icon: Calendar, count: tasks.length },
  ]

  const priorityColors: Record<Priority, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }

  const statusColors: Record<Status, string> = {
    'in-progress': 'bg-blue-100 text-blue-700',
    todo: 'bg-gray-100 text-gray-700',
    done: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  }

  return (
    <aside className="w-64 bg-background border-r flex flex-col shrink-0">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold tracking-tight">Task Planner</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <TaskForm onSubmit={(data) => {
              addTask(data)
            }} />
          </Dialog>
        </div>
        <div className="space-y-1">
          {views.map((view) => (
            <Button
              key={view.id}
              variant={location.pathname === `/${view.id}` ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start text-sm h-9 px-2',
                location.pathname === `/${view.id}` && 'bg-accent'
              )}
              onClick={() => navigate(`/${view.id}`)}
            >
              <view.icon className="mr-2 h-4 w-4" />
              {view.label}
              <Badge variant="secondary" className="ml-auto">{view.count}</Badge>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="p-6 border-b">
        <h3 className="text-sm font-semibold mb-3">Priority Filters</h3>
        <div className="space-y-1">
          {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((priority) => (
            <Button
              key={priority}
              variant="ghost"
              className={cn(
                'w-full justify-start text-sm h-8 px-2',
                'hover:bg-accent'
              )}
            >
              <Badge variant="secondary" className={cn(priorityColors[priority], 'mr-2')}>
                {priority}
              </Badge>
              {priority}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-6 flex-1">
        <h3 className="text-sm font-semibold mb-3">Categories</h3>
        <div className="space-y-1">
          {['Work', 'Personal', 'Learning', 'Health'].map((category) => (
            <Button
              key={category}
              variant="ghost"
              className={cn(
                'w-full justify-start text-sm h-8 px-2',
                'hover:bg-accent'
              )}
            >
              <Tag className="mr-2 h-3 w-3" />
              {category}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  )
}

// Task Card Component
export function TaskCard({ task }: { task: Task }) {
  const { updateTask, deleteTask, completeTask } = useTasks()
  const priorityColors = {
    urgent: 'border-red-200 bg-red-50',
    high: 'border-orange-200 bg-orange-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50',
  }

  const statusColors = {
    'in-progress': 'bg-blue-500',
    todo: 'bg-gray-300',
    done: 'bg-green-500',
    blocked: 'bg-red-500',
  }

  return (
    <Card className={cn(
      'cursor-pointer transition-all duration-200 hover:shadow-md',
      priorityColors[task.priority]
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className={cn(
              'font-medium text-sm',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0',
                task.status === 'done' && 'bg-green-100'
              )}
              onClick={() => completeTask(task.id)}
            >
              {task.status === 'done' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="w-3 h-3 border-2 border-gray-300 rounded-sm" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:text-red-600"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mt-2">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(task.dueDate, 'MMM d, yyyy')}</span>
            </div>
          )}
          <Badge variant="outline" className={cn(
            'text-[9px] px-1.5 py-0.5',
            statusColors[task.status]
          )}>
            {task.status.replace('-', ' ')}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
            {task.priority}
          </Badge>
          {task.category && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
              {task.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Task Form Component
export function TaskForm({ onSubmit, defaultValues }: {
  onSubmit: (data: any) => void,
  defaultValues?: Partial<Task>
}) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    priority: defaultValues?.priority || 'medium',
    status: defaultValues?.status || 'todo',
    dueDate: defaultValues?.dueDate || '',
    category: defaultValues?.category || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    navigate('/today')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter task title..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter task description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Work, Personal..."
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          <Plus className="mr-2 h-4 w-4" />
          {defaultValues ? 'Update Task' : 'Add Task'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Main App Component with Views
export function TaskPlannerApp() {
  const { getTasksByView } = useTasks()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const currentView = location.pathname.replace('/', '') as ViewMode
  const tasks = getTasksByView(currentView)

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
      const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus

      return matchesSearch && matchesPriority && matchesStatus
    })
  }, [tasks, searchQuery, selectedPriority, selectedStatus])

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight capitalize">
              {currentView.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="grid gap-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No tasks found. Add a new task to get started!
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <TaskProvider>
      <TaskPlannerApp />
    </TaskProvider>
  )
}