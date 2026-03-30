"use client";

import { FormEvent, KeyboardEvent, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { TodoComposer } from "@/components/TodoComposer";
import { TodoHighlights } from "@/components/TodoHighlights";
import { TodoList } from "@/components/TodoList";
import { TodoSidebar } from "@/components/TodoSidebar";
import { TodoToast } from "@/components/TodoToast";
import {
  createTodo,
  getCategoryMeta,
  getDueDateTimestamp,
  getProgressValue,
  getTodayLabel,
  isOverdue,
  normalizeTodo,
  type CategoryView,
} from "@/lib/todo-config";
import type { Todo, TodoCategory, TodoFilter, TodoPriority } from "@/types/todo";

const STORAGE_KEY = "taskify.todos";
const UI_STATE_KEY = "taskify.ui-state";
const filters: TodoFilter[] = ["all", "active", "completed"];
const removeDelay = 220;
const toastDelay = 2200;

type ToastState = {
  id: number;
  message: string;
  tone: "success" | "info";
};

type AppTheme = "light" | "dusk";

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TodoCategory>("personal");
  const [priority, setPriority] = useState<TodoPriority>("medium");
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
  const [editingEstimatedTime, setEditingEstimatedTime] = useState("30 min");
  const [editingNotes, setEditingNotes] = useState("");
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const [theme, setTheme] = useState<AppTheme>("light");
  const hasHydrated = useRef(false);

  useEffect(() => {
    const savedTodos = window.localStorage.getItem(STORAGE_KEY);

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

      return secondTodo.createdAt - firstTodo.createdAt;
    });
  }, [activeCategory, filter, searchTerm, starredOnly, todos]);

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - activeCount;
  const overdueCount = todos.filter(isOverdue).length;
  const progressValue = getProgressValue(todos.length, completedCount);
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

  function getCategoryCount(categoryId: TodoCategory): number {
    return todos.filter((todo) => todo.category === categoryId).length;
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

    setTodos((currentTodos) => [createTodo(trimmedTitle, dueDate, category, priority, estimatedTime, notes.trim()), ...currentTodos]);
    setTitle("");
    setDueDate("");
    setCategory("personal");
    setPriority("medium");
    setEstimatedTime("30 min");
    setNotes("");
    showToast(`Added "${trimmedTitle}"`);
  }

  function toggleTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function toggleStar(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, starred: !todo.starred } : todo,
      ),
    );
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
      showToast(`Removed "${removedTodo.title}"`, "info");
    }
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
    setEditingEstimatedTime(todo.estimatedTime);
    setEditingNotes(todo.notes);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDueDate("");
    setEditingCategory("personal");
    setEditingPriority("medium");
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

  return (
    <main className="page-shell">
      <section className="app-shell">
        <TodoSidebar
          activeCategory={activeCategory}
          todayLabel={todayLabel}
          progressValue={progressValue}
          overdueCount={overdueCount}
          totalCount={todos.length}
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
            </div>

            <TodoComposer
              title={title}
              dueDate={dueDate}
              category={category}
              priority={priority}
              estimatedTime={estimatedTime}
              notes={notes}
              onTitleChange={setTitle}
              onDueDateChange={setDueDate}
              onCategoryChange={setCategory}
              onPriorityChange={setPriority}
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
              editingEstimatedTime={editingEstimatedTime}
              editingNotes={editingNotes}
              removingIds={removingIds}
              starredOnly={starredOnly}
              onToggleTodo={toggleTodo}
              onToggleStar={toggleStar}
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
              onEditingEstimatedTimeChange={setEditingEstimatedTime}
              onEditingNotesChange={setEditingNotes}
              onEditKeyDown={handleEditKeyDown}
              subtaskDrafts={subtaskDrafts}
            />
          </section>
        </div>
      </section>

      {toast ? <TodoToast message={toast.message} tone={toast.tone} /> : null}
    </main>
  );
}
