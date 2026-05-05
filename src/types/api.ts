export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  status: number;
};

export type Paginated<T> = { items: T[]; nextCursor: string | null };
