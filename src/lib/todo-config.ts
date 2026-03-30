import type { Todo, TodoCategory, TodoPriority } from "@/types/todo";

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

export function normalizeTodo(todo: Partial<Todo>): Todo {
  return {
    id: todo.id ?? crypto.randomUUID(),
    title: todo.title ?? "",
    completed: Boolean(todo.completed),
    createdAt: todo.createdAt ?? Date.now(),
    dueDate: todo.dueDate ?? "",
    category: normalizeCategory(todo.category),
    priority: normalizePriority(todo.priority),
  };
}

export function createTodo(
  title: string,
  dueDate: string,
  category: TodoCategory,
  priority: TodoPriority,
): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    dueDate,
    category,
    priority,
  };
}

export function getCategoryMeta(category: TodoCategory) {
  return categories.find((item) => item.id === category) ?? categories[1];
}

export function getPriorityMeta(priority: TodoPriority) {
  return priorities.find((item) => item.id === priority) ?? priorities[1];
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
