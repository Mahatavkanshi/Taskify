import {
  categories,
  getCategoryMeta,
  getDueDateLabel,
  getPriorityMeta,
  isOverdue,
  priorities,
} from "@/lib/todo-config";
import type { Todo, TodoCategory, TodoPriority } from "@/types/todo";
import type { KeyboardEvent } from "react";

type TodoListProps = {
  todos: Todo[];
  editingId: string | null;
  editingTitle: string;
  editingDueDate: string;
  editingCategory: TodoCategory;
  editingPriority: TodoPriority;
  removingIds: string[];
  onToggleTodo: (id: string) => void;
  onStartEditing: (todo: Todo) => void;
  onCancelEditing: () => void;
  onSaveEdit: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditingTitleChange: (value: string) => void;
  onEditingDueDateChange: (value: string) => void;
  onEditingCategoryChange: (value: TodoCategory) => void;
  onEditingPriorityChange: (value: TodoPriority) => void;
  onEditKeyDown: (event: KeyboardEvent<HTMLInputElement>, id: string) => void;
};

export function TodoList({
  todos,
  editingId,
  editingTitle,
  editingDueDate,
  editingCategory,
  editingPriority,
  removingIds,
  onToggleTodo,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onDeleteTodo,
  onEditingTitleChange,
  onEditingDueDateChange,
  onEditingCategoryChange,
  onEditingPriorityChange,
  onEditKeyDown,
}: TodoListProps) {
  return (
    <div className="todo-list" aria-live="polite">
      {todos.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks here yet</h3>
          <p>Try another filter, search for a different task, or add a new one here.</p>
        </div>
      ) : (
        todos.map((todo, index) => {
          const categoryMeta = getCategoryMeta(todo.category);
          const priorityMeta = getPriorityMeta(todo.priority);
          const isRemoving = removingIds.includes(todo.id);

          return (
            <article
              key={todo.id}
              className={`todo-item ${categoryMeta.tone}${
                isOverdue(todo) ? " is-overdue" : ""
              }${isRemoving ? " is-removing" : ""}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="todo-main">
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggleTodo(todo.id)}
                  />

                  {editingId === todo.id ? (
                    <div className="edit-fields">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(event) => onEditingTitleChange(event.target.value)}
                        onKeyDown={(event) => onEditKeyDown(event, todo.id)}
                      />
                      <div className="edit-grid edit-grid-wide">
                        <input
                          type="date"
                          value={editingDueDate}
                          onChange={(event) => onEditingDueDateChange(event.target.value)}
                        />
                        <select
                          value={editingCategory}
                          onChange={(event) =>
                            onEditingCategoryChange(event.target.value as TodoCategory)
                          }
                        >
                          {categories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.emoji} {item.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={editingPriority}
                          onChange={(event) =>
                            onEditingPriorityChange(event.target.value as TodoPriority)
                          }
                        >
                          {priorities.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label} priority
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="todo-copy">
                      <div className="todo-heading-row">
                        <strong className={todo.completed ? "completed" : ""}>{todo.title}</strong>
                        <div className="todo-tag-row">
                          <span className={`priority-pill ${priorityMeta.tone}`}>
                            {priorityMeta.label}
                          </span>
                          <span className={`category-pill ${categoryMeta.tone}`}>
                            {categoryMeta.emoji} {categoryMeta.label}
                          </span>
                        </div>
                      </div>
                      <small
                        className={`due-date${isOverdue(todo) ? " due-date-overdue" : ""}`}
                      >
                        {getDueDateLabel(todo)}
                      </small>
                    </div>
                  )}
                </label>
              </div>

              <div className="todo-actions">
                {editingId === todo.id ? (
                  <>
                    <button type="button" onClick={() => onSaveEdit(todo.id)}>
                      Save
                    </button>
                    <button type="button" className="secondary-button" onClick={onCancelEditing}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => onStartEditing(todo)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => onDeleteTodo(todo.id)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? "Removing..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
