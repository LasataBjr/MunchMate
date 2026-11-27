import { useEffect, useMemo, useState } from "react";

import {
  getMachineCategories,
  getMachines,
} from "../../../services/api/machines.api";

import type {
  Machine,
  MachineCategory,
} from "./types/machine.types";

import MachineSearch from "./components/MachineSearch";
import MachineFilters from "./components/MachineFilters";
import MachineGrid from "./components/MachineGrid";

function MachineCatalogPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [categories, setCategories] = useState<MachineCategory[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        setLoading(true);
        setError(null);

        const [machineData, categoryData] = await Promise.all([
          getMachines(),
          getMachineCategories(),
        ]);

        if (cancelled) return;

        setMachines(machineData.machines);
        setCategories(categoryData.categories);
      } catch {
        if (!cancelled) {
          setError("Unable to load machines. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const filteredMachines = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return machines.filter((machine) => {
      const matchesSearch =
        machine.name.toLowerCase().includes(searchTerm) ||
        machine.model_number.toLowerCase().includes(searchTerm) ||
        machine.category_name.toLowerCase().includes(searchTerm);

      const matchesCategory =
        selectedCategory === "all" ||
        machine.category_id.toString() === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [machines, search, selectedCategory]);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Vending Machine Catalogue
        </h1>

        <p className="mt-2 text-fg-muted">
          Explore our vending machines and find the right model
          for your business.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <MachineSearch
          value={search}
          onChange={setSearch}
        />

        <MachineFilters
          categories={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-fg-muted">
          Loading machines...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 p-8 text-center">
          <p className="text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 rounded-lg bg-brand-red px-5 py-2 text-white"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-fg-muted">
            Showing {filteredMachines.length} of {machines.length} machines
          </p>

          <MachineGrid machines={filteredMachines} />
        </>
      )}
    </div>
  );
}

export default MachineCatalogPage;