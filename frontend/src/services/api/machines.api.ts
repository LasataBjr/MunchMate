import { api } from "../../lib/api";
import type { CategoriesResponse, MachinesResponse, } from "../../features/public/machine-catalog/types/machine.types";
import type { Machine } from "../../features/public/machine-catalog/types/machine.types";

export async function getMachines() {
  const response = await api.get<MachinesResponse>("/machines");
  return response.data;
}

export async function getMachineCategories() {
  const response = await api.get<CategoriesResponse>(
    "/machines/categories",
  );

  return response.data;
}

export interface MachineDetailsResponse {
  success: boolean;
  machine: Machine;
}

//GET /machines/:id
export async function getMachineById(id: number) {
  const response = await api.get<MachineDetailsResponse>(
    `/machines/${id}`
  );

  return response.data;
}