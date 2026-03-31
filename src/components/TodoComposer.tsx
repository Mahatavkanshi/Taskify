import {
  categories,
  energyModes,
  estimatedTimes,
  priorities,
  recurrenceModes,
  reminderOptions,
} from "@/lib/todo-config";
import type { TodoCategory, TodoEnergy, TodoPriority, TodoRecurrence } from "@/types/todo";
import type { FormEvent } from "react";

type TodoComposerProps = {
  title: string;
  dueDate: string;
  category: TodoCategory;
  priority: TodoPriority;
  energy: TodoEnergy;
  recurrence: TodoRecurrence;
  reminderMinutes: number;
  estimatedTime: string;
  notes: string;
  onTitleChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onCategoryChange: (value: TodoCategory) => void;
  onPriorityChange: (value: TodoPriority) => void;
  onEnergyChange: (value: TodoEnergy) => void;
  onRecurrenceChange: (value: TodoRecurrence) => void;
  onReminderMinutesChange: (value: number) => void;
  onEstimatedTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TodoComposer({
  title,
  dueDate,
  category,
  priority,
  energy,
  recurrence,
  reminderMinutes,
  estimatedTime,
  notes,
  onTitleChange,
  onDueDateChange,
  onCategoryChange,
  onPriorityChange,
  onEnergyChange,
  onRecurrenceChange,
  onReminderMinutesChange,
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

      <div className="form-field">
        <label className="sr-only" htmlFor="todo-energy">
          Energy label
        </label>
        <select
          id="todo-energy"
          value={energy}
          onChange={(event) => onEnergyChange(event.target.value as TodoEnergy)}
        >
          {energyModes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="sr-only" htmlFor="todo-recurrence">
          Recurrence
        </label>
        <select
          id="todo-recurrence"
          value={recurrence}
          onChange={(event) => onRecurrenceChange(event.target.value as TodoRecurrence)}
        >
          {recurrenceModes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="sr-only" htmlFor="todo-reminder">
          Reminder
        </label>
        <select
          id="todo-reminder"
          value={reminderMinutes}
          onChange={(event) => onReminderMinutesChange(Number(event.target.value))}
        >
          {reminderOptions.map((item) => (
            <option key={item} value={item}>
              {item === 0 ? "No reminder" : `${item} min before`}
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
