import { categories, estimatedTimes, priorities } from "@/lib/todo-config";
import type { TodoCategory, TodoPriority } from "@/types/todo";
import type { FormEvent } from "react";

type TodoComposerProps = {
  title: string;
  dueDate: string;
  category: TodoCategory;
  priority: TodoPriority;
  estimatedTime: string;
  notes: string;
  onTitleChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onCategoryChange: (value: TodoCategory) => void;
  onPriorityChange: (value: TodoPriority) => void;
  onEstimatedTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TodoComposer({
  title,
  dueDate,
  category,
  priority,
  estimatedTime,
  notes,
  onTitleChange,
  onDueDateChange,
  onCategoryChange,
  onPriorityChange,
  onEstimatedTimeChange,
  onNotesChange,
  onSubmit,
}: TodoComposerProps) {
  return (
    <form className="todo-form" onSubmit={onSubmit}>
      <div className="form-field form-field-wide">
        <label className="sr-only" htmlFor="todo-title">
          Todo title
        </label>
        <input
          id="todo-title"
          type="text"
          placeholder="Add a task like 'Finish homepage layout'"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
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
          onChange={(event) => onDueDateChange(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="sr-only" htmlFor="todo-category">
          Category
        </label>
        <select
          id="todo-category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as TodoCategory)}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.emoji} {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="sr-only" htmlFor="todo-priority">
          Priority
        </label>
        <select
          id="todo-priority"
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as TodoPriority)}
        >
          {priorities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} priority
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="sr-only" htmlFor="todo-estimate">
          Estimated time
        </label>
        <select
          id="todo-estimate"
          value={estimatedTime}
          onChange={(event) => onEstimatedTimeChange(event.target.value)}
        >
          {estimatedTimes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field form-field-full">
        <label className="sr-only" htmlFor="todo-notes">
          Notes
        </label>
        <textarea
          id="todo-notes"
          placeholder="Add a note or context for this task"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={3}
        />
      </div>

      <button type="submit">Add Task</button>
    </form>
  );
}
