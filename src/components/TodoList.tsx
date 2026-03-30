import {
  categories,
  estimatedTimes,
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
  editingEstimatedTime: string;
  editingNotes: string;
  removingIds: string[];
  subtaskDrafts: Record<string, string>;
  starredOnly: boolean;
  onToggleTodo: (id: string) => void;
  onToggleStar: (id: string) => void;
  onStartEditing: (todo: Todo) => void;
  onCancelEditing: () => void;
  onSaveEdit: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  onSubtaskDraftChange: (todoId: string, value: string) => void;
  onAddSubtask: (todoId: string) => void;
  onEditingTitleChange: (value: string) => void;
  onEditingDueDateChange: (value: string) => void;
  onEditingCategoryChange: (value: TodoCategory) => void;
  onEditingPriorityChange: (value: TodoPriority) => void;
  onEditingEstimatedTimeChange: (value: string) => void;
  onEditingNotesChange: (value: string) => void;
  onEditKeyDown: (event: KeyboardEvent<HTMLInputElement>, id: string) => void;
};

export function TodoList({
  todos,
  editingId,
  editingTitle,
  editingDueDate,
  editingCategory,
  editingPriority,
  editingEstimatedTime,
  editingNotes,
  removingIds,
  subtaskDrafts,
  starredOnly,
  onToggleTodo,
  onToggleStar,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onDeleteTodo,
  onToggleSubtask,
  onDeleteSubtask,
  onSubtaskDraftChange,
  onAddSubtask,
  onEditingTitleChange,
  onEditingDueDateChange,
  onEditingCategoryChange,
  onEditingPriorityChange,
  onEditingEstimatedTimeChange,
  onEditingNotesChange,
  onEditKeyDown,
}: TodoListProps) {
  return (
    <div className="todo-list" aria-live="polite">
      {todos.length === 0 ? (
        <div className="empty-state">
          <h3>No tasks here yet</h3>
          <p>
            {starredOnly
              ? "No starred tasks match this view yet."
              : "Try another filter, search for a different task, or add a new one here."}
          </p>
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
                        <select
                          value={editingEstimatedTime}
                          onChange={(event) => onEditingEstimatedTimeChange(event.target.value)}
                        >
                          {estimatedTimes.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Add notes for this task"
                        value={editingNotes}
                        onChange={(event) => onEditingNotesChange(event.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="todo-copy">
                      <div className="todo-heading-row">
                        <div className="todo-title-row">
                          <button
                            type="button"
                            className={`star-button${todo.starred ? " is-starred" : ""}`}
                            onClick={() => onToggleStar(todo.id)}
                            aria-label={todo.starred ? "Unstar task" : "Star task"}
                          >
                            {todo.starred ? "★" : "☆"}
                          </button>
                          <strong className={todo.completed ? "completed" : ""}>{todo.title}</strong>
                        </div>
                        <div className="todo-tag-row">
                          <span className="estimate-pill">{todo.estimatedTime}</span>
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

                      {todo.notes ? <p className="todo-notes">{todo.notes}</p> : null}

                      <div className="subtask-block">
                        <div className="subtask-header">
                          <span>Subtasks</span>
                          <small>
                            {todo.subtasks.filter((subtask) => subtask.completed).length}/
                            {todo.subtasks.length || 0}
                          </small>
                        </div>

                        {todo.subtasks.length > 0 ? (
                          <div className="subtask-list">
                            {todo.subtasks.map((subtask) => (
                              <div key={subtask.id} className="subtask-item">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() => onToggleSubtask(todo.id, subtask.id)}
                                  />
                                  <span className={subtask.completed ? "completed" : ""}>
                                    {subtask.title}
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  className="subtask-delete"
                                  onClick={() => onDeleteSubtask(todo.id, subtask.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="subtask-empty">No subtasks yet.</p>
                        )}

                        <div className="subtask-form">
                          <input
                            type="text"
                            placeholder="Add a subtask"
                            value={subtaskDrafts[todo.id] ?? ""}
                            onChange={(event) => onSubtaskDraftChange(todo.id, event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                onAddSubtask(todo.id);
                              }
                            }}
                          />
                          <button type="button" onClick={() => onAddSubtask(todo.id)}>
                            Add
                          </button>
                        </div>
                      </div>
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
