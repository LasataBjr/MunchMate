import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import { getMachineById } from "../../../services/api/machines.api";

import type { Machine,} from "../machine-catalog/types/machine.types";

import MachineImage from "./components/MachineImage";
import MachineSpecifications from "./components/MachineSpecifications";
import MachineEnquiryButton from "./components/MachineEnquiryButton";

function MachineDetailsPage() {
  const { machineId } = useParams();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMachineDetails() {
      const id = Number(machineId);

      if (!Number.isInteger(id) || id <= 0) {
        setError("Invalid machine ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setMachine(null);

        const response = await getMachineById(id);

        if (!cancelled) {
          setMachine(response.machine);
        }
      } catch (error) {
        if (cancelled) return;

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 404
        ) {
          setError("Machine not found.");
        } else {
          setError(
            "Unable to load machine details. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMachineDetails();

    return () => {
      cancelled = true;
    };
  }, [machineId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-fg-muted">
          Loading machine details...
        </p>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold">
          {error || "Machine not found."}
        </h1>

        <Link
          to="/machines"
          className="mt-6 inline-block text-accent hover:underline"
        >
          Back to Machines
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to="/machines"
        className="text-sm text-fg-muted hover:text-accent"
      >
        ← Back to Machines
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        {/* Machine Image */}
        <MachineImage
          imagePath={machine.primary_image}
          machineName={machine.name}
        />

        {/* Machine Information */}
        <div>
          <p className="text-sm font-medium text-accent">
            {machine.category_name}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {machine.name}
          </h1>

          <p className="mt-2 text-fg-muted">
            Model: {machine.model_number}
          </p>

          <div className="mt-6">
            <p className="text-2xl font-bold text-accent">
              NPR {machine.price_npr.toLocaleString("en-NP")}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">
              Description
            </h2>

            <p className="mt-2 whitespace-pre-wrap text-fg-muted">
              {machine.description || "No description available."}
            </p>
          </div>

          <div className="mt-8">
            <MachineEnquiryButton />
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-12 border-t border-line pt-8">
        <MachineSpecifications
          specifications={machine.specifications}
        />
      </div>
    </div>
  );
}

export default MachineDetailsPage;