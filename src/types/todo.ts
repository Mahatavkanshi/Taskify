export type TodoFilter = "all" | "active" | "completed";

export type TodoCategory = "work" | "personal" | "study" | "groceries";

export type TodoPriority = "low" | "medium" | "high";

export type TodoSubtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  dueDate: string;
  category: TodoCategory;
  priority: TodoPriority;
  starred: boolean;
  estimatedTime: string;
  notes: string;
  subtasks: TodoSubtask[];
};
