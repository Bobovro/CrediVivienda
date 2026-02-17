export interface LoginRequest {
  username: string;
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

