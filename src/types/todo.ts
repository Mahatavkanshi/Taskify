export type TodoFilter = "all" | "active" | "completed";

export type TodoCategory = "work" | "personal" | "study" | "groceries";

export type TodoPriority = "low" | "medium" | "high";

export type TodoEnergy = "quick-win" | "deep-work" | "errand";

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
  order: number;
  dueDate: string;
  category: TodoCategory;
  priority: TodoPriority;
  energy: TodoEnergy;
  starred: boolean;
  estimatedTime: string;
  notes: string;
  subtasks: TodoSubtask[];
};
