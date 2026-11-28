export interface AuthUser {
  id: number;
  name: string;
  email: string;
  customer_id: number | null;
  role: "Customer" | "Admin";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface CurrentUserResponse {
  success: boolean;
  user: AuthUser;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface RegisterInput {
  customer_type: "individual" | "company";
  name: string;
  company_name?: string | null;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  customer: {
    id: number;
    customer_type: "individual" | "company";
    company_name: string | null;
    phone: string;
  };
}