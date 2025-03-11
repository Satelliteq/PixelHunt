import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@shared/schema";

type CategorySelectorProps = {
  onCategoryChange: (categoryId: number) => void;
  selectedCategoryId?: number;
};

export default function CategorySelector({
  onCategoryChange,
  selectedCategoryId
}: CategorySelectorProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-zinc-400">Kategori:</span>
      <Select
        disabled={isLoading}
        value={selectedCategoryId?.toString() || ""}
        onValueChange={(value) => onCategoryChange(parseInt(value))}
      >
        <SelectTrigger className="w-[200px] bg-zinc-800">
          <SelectValue placeholder="Kategori seçin" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700">
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
