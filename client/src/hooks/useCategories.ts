import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/lib/firebaseHelpers";

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getAllCategories
  });
} 