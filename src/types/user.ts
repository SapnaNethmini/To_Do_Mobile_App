export type UserId = string & { __brand: 'UserId' };

export type User = {
  id: UserId;
  username: string;
  email: string;
  createdAt: string;
};
