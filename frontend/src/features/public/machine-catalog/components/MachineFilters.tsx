import type { MachineCategory } from "../types/machine.types";

interface MachineFiltersProps {
  categories: MachineCategory[];
  value: string;
  onChange: (value: string) => void;
}

function MachineFilters({
  categories,
  value,
  onChange,
}: MachineFiltersProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Filter machines by category"
      className="w-full rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-brand-red sm:w-64"
    >
      <option value="all">All Categories</option>

      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

export default MachineFilters;