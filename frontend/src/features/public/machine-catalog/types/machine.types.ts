// These types match the interfaces and response objects in backend

export interface Machine {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  model_number: string;
  slug: string;
  description: string | null;
  specifications: string | null;
  price_npr: number;
  currency: string;
  primary_image: string | null;
}

export interface MachineCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface MachinesResponse {
  success: boolean;
  count: number;
  machines: Machine[];
}

export interface CategoriesResponse {
  success: boolean;
  count: number;
  categories: MachineCategory[];
}

