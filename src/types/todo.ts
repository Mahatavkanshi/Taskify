export type TodoFilter = "all" | "active" | "completed";

export type TodoCategory = "work" | "personal" | "study" | "groceries";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  dueDate: string;
  category: TodoCategory;
};
