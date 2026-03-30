"use client";

import {
  FormEvent,
  KeyboardEvent,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Todo, TodoCategory, TodoFilter } from "@/types/todo";

const STORAGE_KEY = "taskify.todos";

const filters: TodoFilter[] = ["all", "active", "completed"];

const categories = [
  { id: "work", label: "Work", emoji: "💼", tone: "tone-work" },
  { id: "personal", label: "Personal", emoji: "🏠", tone: "tone-personal" },
  { id: "study", label: "Study", emoji: "📚", tone: "tone-study" },
  { id: "groceries", label: "Groceries", emoji: "🛒", tone: "tone-groceries" },
] satisfies Array<{
  id: TodoCategory;
  label: string;
  emoji: string;
  tone: string;
}>;

type CategoryView = "all" | TodoCategory;

function createTodo(title: string, dueDate: string, category: TodoCategory): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    dueDate,
    category,
  };
}

function normalizeCategory(category?: string): TodoCategory {
  return categories.some((item) => item.id === category)
    ? (category as TodoCategory)
    : "personal";
}

function normalizeTodo(todo: Partial<Todo>): Todo {
  return {
    id: todo.id ?? crypto.randomUUID(),
    title: todo.title ?? "",
    completed: Boolean(todo.completed),
    createdAt: todo.createdAt ?? Date.now(),
    dueDate: todo.dueDate ?? "",
    category: normalizeCategory(todo.category),
  };
}

function formatDueDate(dueDate: string): string {
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

function getDueDateTimestamp(dueDate: string): number {
  if (!dueDate) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(`${dueDate}T00:00:00`).getTime();

  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function isOverdue(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getDueDateTimestamp(todo.dueDate) < today.getTime();
}

function getDueDateLabel(todo: Todo): string {
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

function getProgressValue(total: number, completed: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function getTodayLabel(): string {
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

function getCategoryMeta(category: TodoCategory) {
  return categories.find((item) => item.id === category) ?? categories[1];
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TodoCategory>("personal");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [activeCategory, setActiveCategory] = useState<CategoryView>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingCategory, setEditingCategory] = useState<TodoCategory>("personal");
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

    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const filteredTodos = useMemo(() => {
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

    return [...byStatus].sort((firstTodo, secondTodo) => {
      const firstDueDate = getDueDateTimestamp(firstTodo.dueDate);
      const secondDueDate = getDueDateTimestamp(secondTodo.dueDate);

      if (firstDueDate !== secondDueDate) {
        return firstDueDate - secondDueDate;
      }

      return secondTodo.createdAt - firstTodo.createdAt;
    });
  }, [activeCategory, filter, todos]);

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - activeCount;
  const overdueCount = todos.filter(isOverdue).length;
  const progressValue = getProgressValue(todos.length, completedCount);
  const todayLabel = getTodayLabel();
  const selectedCategoryMeta = getCategoryMeta(
    activeCategory === "all" ? "personal" : activeCategory,
  );
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTodos((currentTodos) => [createTodo(trimmedTitle, dueDate, category), ...currentTodos]);
    setTitle("");
    setDueDate("");
    setCategory("personal");
  }

  function toggleTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingDueDate(todo.dueDate);
    setEditingCategory(todo.category);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDueDate("");
    setEditingCategory("personal");
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
            }
          : todo,
      ),
    );

    cancelEditing();
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
        <aside className="sidebar-card">
          <div className="sidebar-header">
            <p className="eyebrow">Taskify Lists</p>
            <span className="today-pill">{todayLabel}</span>
          </div>

          <div className="sidebar-intro">
            <h2>Choose your focus</h2>
            <p>Jump between your default lists and keep each part of the day tidy.</p>
          </div>

          <div className="category-list" role="tablist" aria-label="Todo categories">
            <button
              type="button"
              className={`category-item${activeCategory === "all" ? " is-active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              <span className="category-icon all-icon">✨</span>
              <span className="category-copy">
                <strong>All Tasks</strong>
                <small>Everything in one view</small>
              </span>
              <span className="category-count">{todos.length}</span>
            </button>

            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`category-item ${item.tone}${
                  activeCategory === item.id ? " is-active" : ""
                }`}
                onClick={() => setActiveCategory(item.id)}
              >
                <span className="category-icon">{item.emoji}</span>
                <span className="category-copy">
                  <strong>{item.label}</strong>
                  <small>{getCategoryCount(item.id)} task{getCategoryCount(item.id) === 1 ? "" : "s"}</small>
                </span>
                <span className="category-count">{getCategoryCount(item.id)}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-summary">
            <article>
              <span>{progressValue}%</span>
              <p>Done today</p>
            </article>
            <article>
              <span>{overdueCount}</span>
              <p>Need attention</p>
            </article>
          </div>
        </aside>

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

            <form className="todo-form" onSubmit={handleSubmit}>
              <div className="form-field form-field-wide">
                <label className="sr-only" htmlFor="todo-title">
                  Todo title
                </label>
                <input
                  id="todo-title"
                  type="text"
                  placeholder="Add a task like 'Finish homepage layout'"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="sr-only" htmlFor="todo-due-date">
                  Due date
                </label>
                <input
                  id="todo-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="sr-only" htmlFor="todo-category">
                  Category
                </label>
                <select
                  id="todo-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as TodoCategory)}
                >
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.emoji} {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit">Add Task</button>
            </form>

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

            <div className="toolbar">
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
                className="secondary-button"
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                Clear completed
              </button>
            </div>

            <div className="todo-list" aria-live="polite">
              {filteredTodos.length === 0 ? (
                <div className="empty-state">
                  <h3>No tasks here yet</h3>
                  <p>
                    {todos.length === 0
                      ? "Create your first todo to start managing your day."
                      : "Try another filter or add a new task in this category."}
                  </p>
                </div>
              ) : (
                filteredTodos.map((todo) => {
                  const categoryMeta = getCategoryMeta(todo.category);

                  return (
                    <article
                      key={todo.id}
                      className={`todo-item ${categoryMeta.tone}${
                        isOverdue(todo) ? " is-overdue" : ""
                      }`}
                    >
                      <div className="todo-main">
                        <label>
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo.id)}
                          />

                          {editingId === todo.id ? (
                            <div className="edit-fields">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(event) => setEditingTitle(event.target.value)}
                                onKeyDown={(event) => handleEditKeyDown(event, todo.id)}
                              />
                              <div className="edit-grid">
                                <input
                                  type="date"
                                  value={editingDueDate}
                                  onChange={(event) => setEditingDueDate(event.target.value)}
                                />
                                <select
                                  value={editingCategory}
                                  onChange={(event) =>
                                    setEditingCategory(event.target.value as TodoCategory)
                                  }
                                >
                                  {categories.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.emoji} {item.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ) : (
                            <span>
                              <div className="todo-heading-row">
                                <strong className={todo.completed ? "completed" : ""}>{todo.title}</strong>
                                <span className={`category-pill ${categoryMeta.tone}`}>
                                  {categoryMeta.emoji} {categoryMeta.label}
                                </span>
                              </div>
                              <small
                                className={`due-date${isOverdue(todo) ? " due-date-overdue" : ""}`}
                              >
                                {getDueDateLabel(todo)}
                              </small>
                            </span>
                          )}
                        </label>
                      </div>

                      <div className="todo-actions">
                        {editingId === todo.id ? (
                          <>
                            <button type="button" onClick={() => saveEdit(todo.id)}>
                              Save
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startEditing(todo)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => deleteTodo(todo.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
