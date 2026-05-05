export type TodoId = string & { __brand: 'TodoId' };

export type Todo = {
  id: TodoId;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};
