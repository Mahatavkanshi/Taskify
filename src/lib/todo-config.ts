import type { Todo, TodoCategory, TodoEnergy, TodoPriority, TodoSubtask } from "@/types/todo";

export const categories = [
  { id: "work", label: "Work", emoji: "💼", tone: "tone-work" },
  { id: "personal", label: "Personal", emoji: "🏠", tone: "tone-personal" },
  { id: "study", label: "Study", emoji: "📚", tone: "tone-study" },
  { id: "groceries", label: "Groceries", emoji: "🛒", tone: "tone-groceries" },
] as const satisfies Array<{
  id: TodoCategory;
  label: string;
  emoji: string;
  tone: string;
}>;

export const priorities = [
  { id: "low", label: "Low", tone: "priority-low" },
  { id: "medium", label: "Medium", tone: "priority-medium" },
  { id: "high", label: "High", tone: "priority-high" },
] as const satisfies Array<{
  id: TodoPriority;
  label: string;
  tone: string;
}>;

export const estimatedTimes = ["10 min", "30 min", "1 hour", "2 hours"] as const;

export const energyModes = [
  { id: "quick-win", label: "Quick win", tone: "energy-quick" },
  { id: "deep-work", label: "Deep work", tone: "energy-deep" },
  { id: "errand", label: "Errand", tone: "energy-errand" },
] as const satisfies Array<{
  id: TodoEnergy;
  label: string;
  tone: string;
}>;

export type CategoryView = "all" | TodoCategory;

export function normalizeCategory(category?: string): TodoCategory {
  return categories.some((item) => item.id === category)
    ? (category as TodoCategory)
    : "personal";
}

export function normalizePriority(priority?: string): TodoPriority {
  return priorities.some((item) => item.id === priority)
    ? (priority as TodoPriority)
    : "medium";
}

export function normalizeEnergy(energy?: string): TodoEnergy {
  return energyModes.some((item) => item.id === energy)
    ? (energy as TodoEnergy)
    : "quick-win";
}

export function normalizeTodo(todo: Partial<Todo>): Todo {
  return {
    id: todo.id ?? crypto.randomUUID(),
    title: todo.title ?? "",
    completed: Boolean(todo.completed),
    createdAt: todo.createdAt ?? Date.now(),
    order: typeof todo.order === "number" ? todo.order : todo.createdAt ?? Date.now(),
    dueDate: todo.dueDate ?? "",
    category: normalizeCategory(todo.category),
    priority: normalizePriority(todo.priority),
    energy: normalizeEnergy(todo.energy),
    starred: Boolean(todo.starred),
    estimatedTime:
      typeof todo.estimatedTime === "string" && todo.estimatedTime.length > 0
        ? todo.estimatedTime
        : "30 min",
    notes: typeof todo.notes === "string" ? todo.notes : "",
    subtasks: Array.isArray(todo.subtasks)
      ? todo.subtasks.map((subtask) => normalizeSubtask(subtask))
      : [],
  };
}

export function normalizeSubtask(subtask: Partial<TodoSubtask>): TodoSubtask {
  return {
    id: subtask.id ?? crypto.randomUUID(),
    title: subtask.title ?? "",
    completed: Boolean(subtask.completed),
  };
}

export function createTodo(
  title: string,
  dueDate: string,
  category: TodoCategory,
  priority: TodoPriority,
  energy: TodoEnergy,
  estimatedTime: string,
  notes: string,
): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    order: Date.now(),
    dueDate,
    category,
    priority,
    energy,
    starred: false,
    estimatedTime,
    notes,
    subtasks: [],
  };
}

export function getCategoryMeta(category: TodoCategory) {
  return categories.find((item) => item.id === category) ?? categories[1];
}

export function getPriorityMeta(priority: TodoPriority) {
  return priorities.find((item) => item.id === priority) ?? priorities[1];
}

export function getEnergyMeta(energy: TodoEnergy) {
  return energyModes.find((item) => item.id === energy) ?? energyModes[0];
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calculateStreak(completedDates: string[]): number {
  const uniqueDates = [...new Set(completedDates)].sort().reverse();

  if (uniqueDates.length === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (uniqueDates[0] !== getTodayKey()) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (const date of uniqueDates) {
    const cursorKey = cursor.toISOString().slice(0, 10);

    if (date !== cursorKey) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function formatDueDate(dueDate: string): string {
  if (!dueDate) {
    return "No due date";
  }

  const [year, month, day] = dueDate.split("-").map(Number);

  if (!year || !month || !day) {
    return dueDate;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${day} ${months[month - 1]} ${year}`;
}

export function getDueDateTimestamp(dueDate: string): number {
  if (!dueDate) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${dueDate}T00:00:00`).getTime();

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function getStartOfToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime();
}

export function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  return getDueDateTimestamp(todo.dueDate) < getStartOfToday();
}

export function isDueToday(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  return getDueDateTimestamp(todo.dueDate) === getStartOfToday();
}

export function isUpcoming(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  const dueDate = getDueDateTimestamp(todo.dueDate);
  const startOfToday = getStartOfToday();
  const nextWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;

  return dueDate > startOfToday && dueDate <= nextWeek;
}

export function getDueDateLabel(todo: Todo): string {
  if (!todo.dueDate) {
    return "No due date";
  }

  if (todo.completed) {
    return `Completed - due ${formatDueDate(todo.dueDate)}`;
  }

  return isOverdue(todo)
    ? `Overdue - ${formatDueDate(todo.dueDate)}`
    : `Due ${formatDueDate(todo.dueDate)}`;
}

export function getProgressValue(total: number, completed: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function getTodayLabel(): string {
  const date = new Date();
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatDayNumber(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}`;
}

export function formatWeekdayShort(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return "Day";
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return weekdays[new Date(year, month - 1, day).getDay()];
}

export function getDateKeyFromOffset(offset: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  return date.toISOString().slice(0, 10);
}

export function formatReadableDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return dateKey;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${day} ${months[month - 1]}`;
}
