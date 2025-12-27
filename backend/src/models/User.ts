export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  fullName?: string;
  isAdmin?: boolean;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName?: string;
  isAdmin: boolean;
  createdAt: string;
}


