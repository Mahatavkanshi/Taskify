"use client";

import { FormEvent, KeyboardEvent, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { TodoComposer } from "@/components/TodoComposer";
import { TodoList } from "@/components/TodoList";
import { TodoSidebar } from "@/components/TodoSidebar";
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
const filters: TodoFilter[] = ["all", "active", "completed"];
const removeDelay = 220;

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TodoCategory>("personal");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryView>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingCategory, setEditingCategory] = useState<TodoCategory>("personal");
  const [editingPriority, setEditingPriority] = useState<TodoPriority>("medium");
  const [removingIds, setRemovingIds] = useState<string[]>([]);
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
        : byStatus.filter((todo) => todo.title.toLowerCase().includes(normalizedSearch));

    return [...bySearch].sort((firstTodo, secondTodo) => {
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
  }, [activeCategory, filter, searchTerm, todos]);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTodos((currentTodos) => [createTodo(trimmedTitle, dueDate, category, priority), ...currentTodos]);
    setTitle("");
    setDueDate("");
    setCategory("personal");
    setPriority("medium");
  }

  function toggleTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function requestDeleteTodo(id: string) {
    if (removingIds.includes(id)) {
      return;
    }

    setRemovingIds((currentIds) => [...currentIds, id]);

    window.setTimeout(() => {
      setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
      setRemovingIds((currentIds) => currentIds.filter((item) => item !== id));
    }, removeDelay);
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
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingDueDate(todo.dueDate);
    setEditingCategory(todo.category);
    setEditingPriority(todo.priority);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDueDate("");
    setEditingCategory("personal");
    setEditingPriority("medium");
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
        <TodoSidebar
          activeCategory={activeCategory}
          todayLabel={todayLabel}
          progressValue={progressValue}
          overdueCount={overdueCount}
          totalCount={todos.length}
          getCategoryCount={getCategoryCount}
          onSelectCategory={setActiveCategory}
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
              onTitleChange={setTitle}
              onDueDateChange={setDueDate}
              onCategoryChange={setCategory}
              onPriorityChange={setPriority}
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
              removingIds={removingIds}
              onToggleTodo={toggleTodo}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onSaveEdit={saveEdit}
              onDeleteTodo={requestDeleteTodo}
              onEditingTitleChange={setEditingTitle}
              onEditingDueDateChange={setEditingDueDate}
              onEditingCategoryChange={setEditingCategory}
              onEditingPriorityChange={setEditingPriority}
              onEditKeyDown={handleEditKeyDown}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
