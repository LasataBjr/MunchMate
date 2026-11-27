import type { Machine } from "../types/machine.types";
import MachineCard from "./MachineCard";

interface MachineGridProps {
  machines: Machine[];
}

function MachineGrid({ machines }: MachineGridProps) {
  if (machines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-10 text-center">
        <h2 className="text-lg font-semibold">
          No machines found
        </h2>

        <p className="mt-2 text-sm text-fg-muted">
          Try changing your search or category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {machines.map((machine) => (
        <MachineCard key={machine.id} machine={machine} />
      ))}
    </div>
  );
}

export default MachineGrid;