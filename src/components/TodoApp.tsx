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
import type { Todo, TodoFilter } from "@/types/todo";

const STORAGE_KEY = "taskify.todos";

const filters: TodoFilter[] = ["all", "active", "completed"];

function createTodo(title: string, dueDate: string): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    dueDate,
  };
}

function normalizeTodo(todo: Partial<Todo>): Todo {
  return {
    id: todo.id ?? crypto.randomUUID(),
    title: todo.title ?? "",
    completed: Boolean(todo.completed),
    createdAt: todo.createdAt ?? Date.now(),
    dueDate: todo.dueDate ?? "",
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

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
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
    const visibleTodos = (() => {
      switch (filter) {
        case "active":
          return todos.filter((todo) => !todo.completed);
        case "completed":
          return todos.filter((todo) => todo.completed);
        default:
          return todos;
      }
    })();

    return [...visibleTodos].sort((firstTodo, secondTodo) => {
      const firstDueDate = getDueDateTimestamp(firstTodo.dueDate);
      const secondDueDate = getDueDateTimestamp(secondTodo.dueDate);

      if (firstDueDate !== secondDueDate) {
        return firstDueDate - secondDueDate;
      }

      return secondTodo.createdAt - firstTodo.createdAt;
    });
  }, [filter, todos]);

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.length - activeCount;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTodos((currentTodos) => [createTodo(trimmedTitle, dueDate), ...currentTodos]);
    setTitle("");
    setDueDate("");
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
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDueDate("");
  }

  function saveEdit(id: string) {
    const trimmedTitle = editingTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? { ...todo, title: trimmedTitle, dueDate: editingDueDate }
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
      <section className="hero-card">
        <p className="eyebrow">Beginner-friendly Next.js project</p>
        <h1>Build your daily focus list with Taskify.</h1>
        <p className="hero-copy">
          This version keeps the stack simple: Next.js, TypeScript, React state,
          and localStorage for saving tasks in the browser.
        </p>

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
          <button type="submit">Add Task</button>
        </form>

        <div className="stats-row">
          <article>
            <span>{todos.length}</span>
            <p>Total tasks</p>
          </article>
          <article>
            <span>{activeCount}</span>
            <p>Still active</p>
          </article>
          <article>
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
              <h2>No tasks here yet</h2>
              <p>
                {todos.length === 0
                  ? "Create your first todo to start managing your day."
                  : "Try another filter or add a new task."}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <article
                key={todo.id}
                className={`todo-item${isOverdue(todo) ? " is-overdue" : ""}`}
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
                        <input
                          type="date"
                          value={editingDueDate}
                          onChange={(event) => setEditingDueDate(event.target.value)}
                        />
                      </div>
                    ) : (
                      <span>
                        <strong className={todo.completed ? "completed" : ""}>{todo.title}</strong>
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
            ))
          )}
        </div>
      </section>
    </main>
  );
}
