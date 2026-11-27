interface MachineSearchProps {
  value: string;
  onChange: (value: string) => void;
}

function MachineSearch({ value, onChange }: MachineSearchProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search machines by name or model..."
      aria-label="Search machines"
      className="w-full rounded-lg border border-line px-4 py-3 outline-none focus:border-brand-red"
    />
  );
}

export default MachineSearch;