
import { Link } from "react-router-dom";
import type { Machine } from "../types/machine.types";

interface MachineCardProps {
  machine: Machine;
}

function MachineCard({ machine }: MachineCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 2,
  }).format(machine.price_npr);

  return (
    <Link
      to={`/machines/${machine.id}`}
      className="block overflow-hidden rounded-xl border border-line bg-white text-gray-900 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
    >
      <article>
        <div className="flex h-48 items-center justify-center bg-gray-100">
          {/*
            Image display will be connected after we verify
            how the backend serves machine image paths.
          */}
          <span className="text-sm text-gray-600">
            Machine Image
          </span>
        </div>

        <div className="p-5">
          <p className="text-sm font-medium text-brand-red">
            {machine.category_name}
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            {machine.name}
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Model: {machine.model_number}
          </p>

          {machine.description && (
            <p className="mt-3 line-clamp-2 text-sm text-gray-600">
              {machine.description}
            </p>
          )}

          <p className="mt-4 font-semibold text-gray-900">
            NPR {formattedPrice}
          </p>

          <span className="mt-4 inline-block font-medium text-brand-red">
            View Details →
          </span>
        </div>
      </article>
    </Link>
  );
}

export default MachineCard;
