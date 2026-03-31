"use client";

import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { TodoAnalytics } from "@/components/TodoAnalytics";
import { TodoCalendar } from "@/components/TodoCalendar";
import { TodoComposer } from "@/components/TodoComposer";
import { TodoHighlights } from "@/components/TodoHighlights";
import { TodoList } from "@/components/TodoList";
import { TodoSidebar } from "@/components/TodoSidebar";
import { TodoToast } from "@/components/TodoToast";
import {
  calculateStreak,
  createTodo,
  getCategoryMeta,
  getDueDateTimestamp,
  getEnergyMeta,
  getProgressValue,
  getRecurrenceLabel,
  getTodayKey,
  getTodayLabel,
  isOverdue,
  normalizeTodo,
  shiftRecurringDate,
  type CategoryView,
} from "@/lib/todo-config";
import type {
  Todo,
  TodoCategory,
  TodoEnergy,
  TodoFilter,
  TodoPriority,
  TodoRecurrence,
} from "@/types/todo";

const STORAGE_KEY = "taskify.todos";
const UI_STATE_KEY = "taskify.ui-state";
const STREAK_KEY = "taskify.completed-days";
const filters: TodoFilter[] = ["all", "active", "completed"];
const removeDelay = 220;
const toastDelay = 2200;

type ToastState = {
  id: number;
  message: string;
  tone: "success" | "info";
};

type AppTheme = "light" | "dusk";
type ReminderPermissionState = "default" | "denied" | "granted" | "unsupported";

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TodoCategory>("personal");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [energy, setEnergy] = useState<TodoEnergy>("quick-win");
  const [recurrence, setRecurrence] = useState<TodoRecurrence>("none");
  const [reminderMinutes, setReminderMinutes] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState("30 min");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryView>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingCategory, setEditingCategory] = useState<TodoCategory>("personal");
  const [editingPriority, setEditingPriority] = useState<TodoPriority>("medium");
  const [editingEnergy, setEditingEnergy] = useState<TodoEnergy>("quick-win");
  const [editingRecurrence, setEditingRecurrence] = useState<TodoRecurrence>("none");
  const [editingReminderMinutes, setEditingReminderMinutes] = useState(0);
  const [editingEstimatedTime, setEditingEstimatedTime] = useState("30 min");
  const [editingNotes, setEditingNotes] = useState("");
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const [theme, setTheme] = useState<AppTheme>("light");
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [focusTodoId, setFocusTodoId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notificationPermission, setNotificationPermission] =
    useState<ReminderPermissionState>("default");
  const hasHydrated = useRef(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const reminderTimeoutsRef = useRef<Record<string, number>>({});
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const savedTodos = window.localStorage.getItem(STORAGE_KEY);
    const savedCompletedDays = window.localStorage.getItem(STREAK_KEY);

    if (savedTodos) {
      try {
        const parsedTodos = (JSON.parse(savedTodos) as Partial<Todo>[]).map(normalizeTodo);
        startTransition(() => {
          setTodos(parsedTodos);
        });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const savedUiState = window.localStorage.getItem(UI_STATE_KEY);

    if (savedUiState) {
      try {
        const parsedUiState = JSON.parse(savedUiState) as {
          filter?: TodoFilter;
          starredOnly?: boolean;
          searchTerm?: string;
          activeCategory?: CategoryView;
          theme?: AppTheme;
        };

        startTransition(() => {
          if (parsedUiState.filter && filters.includes(parsedUiState.filter)) {
            setFilter(parsedUiState.filter);
          }

          if (typeof parsedUiState.searchTerm === "string") {
            setSearchTerm(parsedUiState.searchTerm);
          }

          if (typeof parsedUiState.starredOnly === "boolean") {
            setStarredOnly(parsedUiState.starredOnly);
          }

          if (
            parsedUiState.activeCategory === "all" ||
            (typeof parsedUiState.activeCategory === "string" &&
              ["work", "personal", "study", "groceries"].includes(parsedUiState.activeCategory))
          ) {
            setActiveCategory(parsedUiState.activeCategory);
          }

          if (parsedUiState.theme === "light" || parsedUiState.theme === "dusk") {
            setTheme(parsedUiState.theme);
          }
        });
      } catch {
        window.localStorage.removeItem(UI_STATE_KEY);
      }
    }

    if (savedCompletedDays) {
      try {
        const parsedCompletedDays = JSON.parse(savedCompletedDays) as string[];

        if (Array.isArray(parsedCompletedDays)) {
          startTransition(() => {
            setCompletedDays(parsedCompletedDays.filter((item) => typeof item === "string"));
          });
        }
      } catch {
        window.localStorage.removeItem(STREAK_KEY);
      }
    }

    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    window.localStorage.setItem(
      UI_STATE_KEY,
      JSON.stringify({ activeCategory, filter, starredOnly, searchTerm, theme }),
    );
  }, [activeCategory, filter, searchTerm, starredOnly, theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    window.localStorage.setItem(STREAK_KEY, JSON.stringify(completedDays));
  }, [completedDays]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === toast.id ? null : currentToast,
      );
    }, toastDelay);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (focusTodoId) {
        setFocusTodoId(null);
      }

      if (isCalendarOpen) {
        setIsCalendarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [focusTodoId, isCalendarOpen]);

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    setNotificationPermission(Notification.permission as ReminderPermissionState);
  }, []);

  useEffect(() => {
    Object.values(reminderTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
    reminderTimeoutsRef.current = {};

    if (notificationPermission !== "granted") {
      return;
    }

    const now = Date.now();

    todos.forEach((todo) => {
      if (todo.completed || !todo.dueDate || todo.reminderMinutes <= 0) {
        return;
      }

      const triggerAt = getDueDateTimestamp(todo.dueDate) - todo.reminderMinutes * 60 * 1000;

      if (triggerAt <= now || notifiedIdsRef.current.has(todo.id)) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        new Notification("Taskify reminder", {
          body: `${todo.title} is due soon${todo.recurrence !== "none" ? ` (${getRecurrenceLabel(todo.recurrence)})` : ""}.`,
        });
        notifiedIdsRef.current.add(todo.id);
      }, triggerAt - now);

      reminderTimeoutsRef.current[todo.id] = timeoutId;
    });

    return () => {
      Object.values(reminderTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      reminderTimeoutsRef.current = {};
    };
  }, [notificationPermission, todos]);

  const filteredTodos = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const byCategory =
      activeCategory === "all"
        ? todos
        : todos.filter((todo) => todo.category === activeCategory);

    const byStatus = (() => {
      switch (filter) {
        case "active":
          return byCategory.filter((todo) => !todo.completed);
        case "completed":
          return byCategory.filter((todo) => todo.completed);
        default:
          return byCategory;
      }
    })();

    const bySearch =
      normalizedSearch.length === 0
        ? byStatus
        : byStatus.filter(
            (todo) =>
              todo.title.toLowerCase().includes(normalizedSearch) ||
              todo.notes.toLowerCase().includes(normalizedSearch),
          );

    const byStar = starredOnly ? bySearch.filter((todo) => todo.starred) : bySearch;

    return [...byStar].sort((firstTodo, secondTodo) => {
      if (firstTodo.starred !== secondTodo.starred) {
        return firstTodo.starred ? -1 : 1;
      }

      const energyWeight = { "quick-win": 0, errand: 1, "deep-work": 2 } as const;
      const firstEnergy = energyWeight[firstTodo.energy];
      const secondEnergy = energyWeight[secondTodo.energy];

      if (firstEnergy !== secondEnergy) {
        return firstEnergy - secondEnergy;
      }

      const firstDueDate = getDueDateTimestamp(firstTodo.dueDate);
      const secondDueDate = getDueDateTimestamp(secondTodo.dueDate);

      if (firstDueDate !== secondDueDate) {
        return firstDueDate - secondDueDate;
      }

      const priorityWeight = { high: 0, medium: 1, low: 2 } as const;
      const firstPriority = priorityWeight[firstTodo.priority];
      const secondPriority = priorityWeight[secondTodo.priority];

      if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
      }

      if (firstTodo.order !== secondTodo.order) {
        return secondTodo.order - firstTodo.order;
      }

      return secondTodo.createdAt - firstTodo.createdAt;
    });
  }, [activeCategory, filter, searchTerm, starredOnly, todos]);

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - activeCount;
  const overdueCount = todos.filter(isOverdue).length;
  const progressValue = getProgressValue(todos.length, completedCount);
  const streakCount = calculateStreak(completedDays);
  const todayLabel = getTodayLabel();
  const selectedCategoryMeta = getCategoryMeta(activeCategory === "all" ? "personal" : activeCategory);
  const selectedCategoryTitle =
    activeCategory === "all"
      ? "All Tasks"
      : `${selectedCategoryMeta.emoji} ${selectedCategoryMeta.label}`;
  const selectedCategoryDescription =
    activeCategory === "all"
      ? "See every task in one place and keep your day moving."
      : `Focused view for your ${selectedCategoryMeta.label.toLowerCase()} list.`;
  const focusTodo = focusTodoId ? todos.find((todo) => todo.id === focusTodoId) ?? null : null;

  function getCategoryCount(categoryId: TodoCategory): number {
    return todos.filter((todo) => todo.category === categoryId).length;
  }

  function moveTodo(draggedId: string, targetId: string) {
    if (draggedId === targetId) {
      return;
    }

    const orderedIds = filteredTodos.map((todo) => todo.id);
    const draggedIndex = orderedIds.indexOf(draggedId);
    const targetIndex = orderedIds.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextIds = [...orderedIds];
    const [draggedItem] = nextIds.splice(draggedIndex, 1);
    nextIds.splice(targetIndex, 0, draggedItem);

    const orderMap = new Map(nextIds.map((id, index) => [id, nextIds.length - index]));

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        orderMap.has(todo.id) ? { ...todo, order: orderMap.get(todo.id) ?? todo.order } : todo,
      ),
    );
  }

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast({ id: Date.now(), message, tone });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTodos((currentTodos) => [createTodo(trimmedTitle, dueDate, category, priority, energy, recurrence, reminderMinutes, estimatedTime, notes.trim()), ...currentTodos]);
    setTitle("");
    setDueDate("");
    setCategory("personal");
    setPriority("medium");
    setEnergy("quick-win");
    setRecurrence("none");
    setReminderMinutes(0);
    setEstimatedTime("30 min");
    setNotes("");
    showToast(`Added "${trimmedTitle}"`);
  }

  function toggleTodo(id: string) {
    const targetTodo = todos.find((todo) => todo.id === id);

    setTodos((currentTodos) => {
      const updatedTodos = currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      );

      if (!targetTodo || targetTodo.completed || targetTodo.recurrence === "none") {
        return updatedTodos;
      }

      return [
        {
          ...targetTodo,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          order: Date.now(),
          dueDate: shiftRecurringDate(targetTodo.dueDate, targetTodo.recurrence),
          completed: false,
          starred: false,
          subtasks: targetTodo.subtasks.map((subtask) => ({
            ...subtask,
            id: crypto.randomUUID(),
            completed: false,
          })),
        },
        ...updatedTodos,
      ];
    });

    if (targetTodo && !targetTodo.completed) {
      const todayKey = getTodayKey();
      setCompletedDays((currentDays) =>
        currentDays.includes(todayKey) ? currentDays : [todayKey, ...currentDays],
      );
    }
  }

  function toggleStar(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, starred: !todo.starred } : todo,
      ),
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredTodos.map((todo) => todo.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((currentIds) =>
      allSelected
        ? currentIds.filter((id) => !visibleIds.includes(id))
        : [...new Set([...currentIds, ...visibleIds])],
    );
  }

  function completeSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        selectedIds.includes(todo.id) ? { ...todo, completed: true } : todo,
      ),
    );
    setSelectedIds([]);
    const todayKey = getTodayKey();
    setCompletedDays((currentDays) =>
      currentDays.includes(todayKey) ? currentDays : [todayKey, ...currentDays],
    );
    showToast("Completed selected tasks");
  }

  function deleteSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    setTodos((currentTodos) => currentTodos.filter((todo) => !selectedIds.includes(todo.id)));
    setSelectedIds([]);
    showToast("Deleted selected tasks", "info");
  }

  function toggleSubtask(todoId: string, subtaskId: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask,
              ),
            }
          : todo,
      ),
    );
  }

  function deleteSubtask(todoId: string, subtaskId: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.filter((subtask) => subtask.id !== subtaskId),
            }
          : todo,
      ),
    );
    showToast("Removed subtask", "info");
  }

  function updateSubtaskDraft(todoId: string, value: string) {
    setSubtaskDrafts((currentDrafts) => ({ ...currentDrafts, [todoId]: value }));
  }

  function addSubtask(todoId: string) {
    const draft = (subtaskDrafts[todoId] ?? "").trim();

    if (!draft) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: [
                ...todo.subtasks,
                { id: crypto.randomUUID(), title: draft, completed: false },
              ],
            }
          : todo,
      ),
    );
    setSubtaskDrafts((currentDrafts) => ({ ...currentDrafts, [todoId]: "" }));
    showToast(`Added subtask "${draft}"`);
  }

  function requestDeleteTodo(id: string) {
    if (removingIds.includes(id)) {
      return;
    }

    setRemovingIds((currentIds) => [...currentIds, id]);

    const removedTodo = todos.find((todo) => todo.id === id);

    window.setTimeout(() => {
      setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
      setRemovingIds((currentIds) => currentIds.filter((item) => item !== id));
    }, removeDelay);

    if (removedTodo) {
      if (focusTodoId === id) {
        setFocusTodoId(null);
      }
      showToast(`Removed "${removedTodo.title}"`, "info");
    }
  }

  function duplicateTodo(id: string) {
    const sourceTodo = todos.find((todo) => todo.id === id);

    if (!sourceTodo) {
      return;
    }

    setTodos((currentTodos) => [
      {
        ...sourceTodo,
        id: crypto.randomUUID(),
        title: `${sourceTodo.title} copy`,
        completed: false,
        starred: false,
        createdAt: Date.now(),
        subtasks: sourceTodo.subtasks.map((subtask) => ({
          ...subtask,
          id: crypto.randomUUID(),
          completed: false,
        })),
      },
      ...currentTodos,
    ]);

    showToast(`Duplicated "${sourceTodo.title}"`);
  }

  function clearCompleted() {
    const completedIds = todos.filter((todo) => todo.completed).map((todo) => todo.id);

    if (completedIds.length === 0) {
      return;
    }

    setRemovingIds((currentIds) => [...new Set([...currentIds, ...completedIds])]);

    window.setTimeout(() => {
      setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
      setRemovingIds((currentIds) => currentIds.filter((id) => !completedIds.includes(id)));
    }, removeDelay);

    showToast(`Cleared ${completedIds.length} completed task${completedIds.length === 1 ? "" : "s"}`);
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingDueDate(todo.dueDate);
    setEditingCategory(todo.category);
    setEditingPriority(todo.priority);
    setEditingEnergy(todo.energy);
    setEditingEstimatedTime(todo.estimatedTime);
    setEditingNotes(todo.notes);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDueDate("");
    setEditingCategory("personal");
    setEditingPriority("medium");
    setEditingEnergy("quick-win");
    setEditingEstimatedTime("30 min");
    setEditingNotes("");
  }

  function saveEdit(id: string) {
    const trimmedTitle = editingTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              title: trimmedTitle,
              dueDate: editingDueDate,
              category: editingCategory,
              priority: editingPriority,
              energy: editingEnergy,
              estimatedTime: editingEstimatedTime,
              notes: editingNotes.trim(),
            }
          : todo,
      ),
    );

    cancelEditing();
    showToast(`Updated "${trimmedTitle}"`);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>, id: string) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit(id);
    }

    if (event.key === "Escape") {
      cancelEditing();
    }
  }

  function handleDragStart(id: string) {
    setDraggingTodoId(id);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
  }

  function handleDrop(targetId: string) {
    if (!draggingTodoId) {
      return;
    }

    moveTodo(draggingTodoId, targetId);
    setDraggingTodoId(null);
  }

  function moveTodoToDate(dateKey: string) {
    if (!draggingTodoId) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === draggingTodoId ? { ...todo, dueDate: dateKey } : todo,
      ),
    );
    setDraggingTodoId(null);
    showToast(`Moved task to ${dateKey}`);
  }

  function exportTodos() {
    const payload = JSON.stringify(todos, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taskify-export-${getTodayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Exported todos as JSON");
  }

  function triggerImport() {
    importInputRef.current?.click();
  }

  async function importTodos(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsedTodos = JSON.parse(text) as Partial<Todo>[];

      if (!Array.isArray(parsedTodos)) {
        throw new Error("Invalid file format");
      }

      const normalizedTodos = parsedTodos.map(normalizeTodo);
      setTodos(normalizedTodos);
      setFocusTodoId(null);
      showToast(`Imported ${normalizedTodos.length} task${normalizedTodos.length === 1 ? "" : "s"}`);
    } catch {
      showToast("Import failed. Use a valid Taskify JSON export.", "info");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="page-shell">
      <section className="app-shell">
        <TodoSidebar
          activeCategory={activeCategory}
          todayLabel={todayLabel}
          progressValue={progressValue}
          overdueCount={overdueCount}
          totalCount={todos.length}
          streakCount={streakCount}
          getCategoryCount={getCategoryCount}
          onSelectCategory={setActiveCategory}
          theme={theme}
          onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "light" ? "dusk" : "light"))}
        />

        <div className="main-card">
          <div className="hero-card">
            <div className="hero-topbar">
              <p className="eyebrow">Daily dashboard</p>
              <span className="selected-pill">{selectedCategoryTitle}</span>
            </div>

            <div className="hero-grid">
              <div>
                <h1>Plan the day. Finish what matters.</h1>
                <p className="hero-copy">Turn busy thoughts into a clear daily rhythm, one focused task at a time.</p>
              </div>

              <aside className="progress-card">
                <div className="progress-header">
                  <span>Daily progress</span>
                  <strong>{progressValue}%</strong>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${progressValue}%` }} />
                </div>
                <div className="progress-meta">
                  <p>{completedCount} completed</p>
                  <p>{overdueCount} overdue</p>
                </div>
              </aside>
            </div>
          </div>

          <section className="panel-card">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Current list</p>
                <h2>{selectedCategoryTitle}</h2>
                <p className="panel-copy">{selectedCategoryDescription}</p>
              </div>
              <button
                type="button"
                className="calendar-trigger"
                aria-label="Open calendar"
                onClick={() => setIsCalendarOpen(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="calendar-trigger-icon">
                  <path
                    d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8ZM8 12a1 1 0 0 1 .117 1.993L8 14H7a1 1 0 0 1-.117-1.993L7 12h1Zm5 0a1 1 0 0 1 .117 1.993L13 14h-1a1 1 0 0 1-.117-1.993L12 12h1Zm5 0a1 1 0 0 1 .117 1.993L18 14h-1a1 1 0 0 1-.117-1.993L17 12h1ZM5 6a1 1 0 0 0-1 1v1h16V7a1 1 0 0 0-1-1H5Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <TodoComposer
              title={title}
              dueDate={dueDate}
              category={category}
              priority={priority}
              energy={energy}
              estimatedTime={estimatedTime}
              notes={notes}
              onTitleChange={setTitle}
              onDueDateChange={setDueDate}
              onCategoryChange={setCategory}
              onPriorityChange={setPriority}
              onEnergyChange={setEnergy}
              onEstimatedTimeChange={setEstimatedTime}
              onNotesChange={setNotes}
              onSubmit={handleSubmit}
            />

            <div className="stats-row">
              <article className="stat-card stat-card-total">
                <span>{todos.length}</span>
                <p>Total tasks</p>
              </article>
              <article className="stat-card stat-card-active">
                <span>{activeCount}</span>
                <p>Still active</p>
              </article>
              <article className="stat-card stat-card-completed">
                <span>{completedCount}</span>
                <p>Completed</p>
              </article>
            </div>

            <div className="insight-grid">
              <TodoAnalytics todos={filteredTodos} completedDays={completedDays} />
            </div>

            <TodoHighlights todos={filteredTodos} />

            <div className="toolbar">
              <div className="toolbar-group">
                <div className="filter-group" role="tablist" aria-label="Todo filters">
                  {filters.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={filter === item ? "is-active" : ""}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={starredOnly ? "filter-star is-active" : "filter-star"}
                  onClick={() => setStarredOnly((currentValue) => !currentValue)}
                >
                  {starredOnly ? "Starred only" : "Show starred"}
                </button>

                <div className="search-field">
                  <label className="sr-only" htmlFor="todo-search">
                    Search todos
                  </label>
                  <input
                    id="todo-search"
                    type="search"
                    placeholder="Search tasks"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                <div className="io-group">
                  <button type="button" className="secondary-button" onClick={exportTodos}>
                    Export JSON
                  </button>
                  <button type="button" className="secondary-button" onClick={triggerImport}>
                    Import JSON
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json"
                    className="sr-only"
                    onChange={importTodos}
                  />
                </div>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                Clear completed
              </button>
            </div>

            <TodoList
              todos={filteredTodos}
              editingId={editingId}
              editingTitle={editingTitle}
              editingDueDate={editingDueDate}
              editingCategory={editingCategory}
              editingPriority={editingPriority}
              editingEnergy={editingEnergy}
              editingEstimatedTime={editingEstimatedTime}
              editingNotes={editingNotes}
              removingIds={removingIds}
              starredOnly={starredOnly}
              onToggleTodo={toggleTodo}
              onToggleStar={toggleStar}
              onDuplicateTodo={duplicateTodo}
              onOpenFocus={setFocusTodoId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onToggleSubtask={toggleSubtask}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onSaveEdit={saveEdit}
              onDeleteTodo={requestDeleteTodo}
              onDeleteSubtask={deleteSubtask}
              onSubtaskDraftChange={updateSubtaskDraft}
              onAddSubtask={addSubtask}
              onEditingTitleChange={setEditingTitle}
              onEditingDueDateChange={setEditingDueDate}
              onEditingCategoryChange={setEditingCategory}
              onEditingPriorityChange={setEditingPriority}
              onEditingEnergyChange={setEditingEnergy}
              onEditingEstimatedTimeChange={setEditingEstimatedTime}
              onEditingNotesChange={setEditingNotes}
              onEditKeyDown={handleEditKeyDown}
              subtaskDrafts={subtaskDrafts}
            />
          </section>
        </div>
      </section>

      {focusTodo ? (
        <div className="focus-overlay" role="dialog" aria-modal="true" onClick={() => setFocusTodoId(null)}>
          <div className="focus-card modal-pop" onClick={(event) => event.stopPropagation()}>
            <div className="focus-head">
              <p className="panel-kicker">Focus mode</p>
              <button type="button" className="secondary-button" onClick={() => setFocusTodoId(null)}>
                Close
              </button>
            </div>

            <div className="focus-body">
              <div className="focus-title-row">
                <button
                  type="button"
                  className={`star-button${focusTodo.starred ? " is-starred" : ""}`}
                  onClick={() => toggleStar(focusTodo.id)}
                >
                  {focusTodo.starred ? "★" : "☆"}
                </button>
                <h3>{focusTodo.title}</h3>
              </div>

              <div className="focus-tags">
                <span className={`category-pill ${getCategoryMeta(focusTodo.category).tone}`}>
                  {getCategoryMeta(focusTodo.category).emoji} {getCategoryMeta(focusTodo.category).label}
                </span>
                <span className="estimate-pill">{focusTodo.estimatedTime}</span>
                <span className={`priority-pill ${focusTodo.priority === "low" ? "priority-low" : focusTodo.priority === "medium" ? "priority-medium" : "priority-high"}`}>
                  {focusTodo.priority}
                </span>
                <span className={`energy-pill ${getEnergyMeta(focusTodo.energy).tone}`}>
                  {getEnergyMeta(focusTodo.energy).label}
                </span>
              </div>

              <p className="focus-due">{focusTodo.dueDate ? `Due ${focusTodo.dueDate}` : "No due date set"}</p>
              {focusTodo.notes ? <p className="focus-notes">{focusTodo.notes}</p> : null}

              <div className="focus-actions">
                <button type="button" onClick={() => toggleTodo(focusTodo.id)}>
                  {focusTodo.completed ? "Mark active" : "Mark complete"}
                </button>
                <button type="button" className="secondary-button" onClick={() => startEditing(focusTodo)}>
                  Edit task
                </button>
              </div>

              <div className="focus-subtasks">
                <p className="panel-kicker">Subtasks</p>
                {focusTodo.subtasks.length === 0 ? (
                  <p className="subtask-empty">No subtasks yet.</p>
                ) : (
                  <div className="subtask-list">
                    {focusTodo.subtasks.map((subtask) => (
                      <div key={subtask.id} className="subtask-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(focusTodo.id, subtask.id)}
                          />
                          <span className={subtask.completed ? "completed" : ""}>{subtask.title}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCalendarOpen ? (
        <div className="focus-overlay" role="dialog" aria-modal="true" onClick={() => setIsCalendarOpen(false)}>
          <div className="calendar-modal-card modal-pop" onClick={(event) => event.stopPropagation()}>
            <div className="focus-head">
              <div>
                <p className="panel-kicker">Due date calendar</p>
                <h3 className="calendar-modal-title">Plan by month</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsCalendarOpen(false)}
              >
                Close
              </button>
            </div>

            <TodoCalendar
              todos={filteredTodos}
              onOpenFocus={setFocusTodoId}
              onMoveTodoToDate={moveTodoToDate}
            />
          </div>
        </div>
      ) : null}

      {toast ? <TodoToast message={toast.message} tone={toast.tone} /> : null}
    </main>
  );
}
