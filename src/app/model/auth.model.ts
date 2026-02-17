export interface LoginRequest {
  username: string; // DNI
  password: string;
}

export interface AuthResponse {
  jwt: string;
  roles: string[];
}

export interface RegisterRequest {
  dni: string;
  password: string;
}

