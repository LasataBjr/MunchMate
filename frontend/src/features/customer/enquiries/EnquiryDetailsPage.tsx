
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Package,
  RefreshCw,
} from "lucide-react";
import { isAxiosError } from "axios";

import { getMyEnquiryById } from "../../../services/api/enquiries.api";

import type {
  MyEnquiryDetailsResponse,
} from "../../public/enquiries/types/enquiry.types";

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Display enquiry status
function EnquiryStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const statusStyles: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    reviewing: "bg-yellow-50 text-yellow-700",
    quoted: "bg-purple-50 text-purple-700",
    accepted: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const style =
    statusStyles[normalizedStatus] ?? "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

// Main page
function EnquiryDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [enquiry, setEnquiry] =
    useState<MyEnquiryDetailsResponse["enquiry"] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchEnquiry() {
      if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
        setError("Invalid enquiry ID.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        setNotFound(false);
        setEnquiry(null);

        const response = await getMyEnquiryById(Number(id));

        if (!cancelled) {
          setEnquiry(response.enquiry);
        }
      } catch (err) {
        if (cancelled) return;

        if (isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(
            "Unable to load this enquiry. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchEnquiry();

    return () => {
      cancelled = true;
    };
  }, [id, retryCount]);

  return (
    <section className="min-h-screen bg-surface p-4 sm:p-6">

      {/* Back navigation */}
      <Link
        to="/customer/enquiries"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-fg-muted transition hover:text-accent"
      >
        <ArrowLeft size={18} />
        Back to My Enquiries
      </Link>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">
          Enquiry Details
        </h1>

        <p className="mt-1 text-sm text-fg-muted">
          View the details and machines included in your enquiry.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="rounded-xl border border-line bg-white p-10 text-center">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-[#C31C2A]"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading enquiry details...
          </p>
        </div>
      )}

      {/* Not found */}
      {!isLoading && notFound && (
        <div className="rounded-xl border border-line bg-white p-10 text-center">
          <ClipboardList
            size={36}
            className="mx-auto text-gray-400"
          />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Enquiry not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            This enquiry does not exist or is not available in your account.
          </p>

          <Link
            to="/customer/enquiries"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C31C2A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A31C28]"
          >
            <ArrowLeft size={16} />
            Back to Enquiries
          </Link>
        </div>
      )}

      {/* General error */}
      {!isLoading && error && !notFound && (
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <AlertCircle
            size={32}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-3 font-semibold text-gray-900">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C31C2A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A31C28]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* Enquiry details */}
      {!isLoading && !error && !notFound && enquiry && (
        <div className="space-y-5">

          {/* Enquiry overview */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Enquiry Number
                </p>

                <h2 className="mt-1 break-all text-xl font-bold text-gray-900">
                  {enquiry.enquiry_number}
                </h2>
              </div>

              <EnquiryStatusBadge status={enquiry.status} />
            </div>

            <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={20}
                  className="mt-0.5 text-gray-400"
                />

                <div>
                  <p className="text-sm text-gray-500">
                    Submitted On
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(enquiry.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RefreshCw
                  size={20}
                  className="mt-0.5 text-gray-400"
                />

                <div>
                  <p className="text-sm text-gray-500">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(enquiry.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer message */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold text-gray-900">
              Your Message
            </h2>

            {enquiry.message ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {enquiry.message}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-gray-400">
                No additional message was provided.
              </p>
            )}
          </div>

          {/* Machine items */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Package size={22} className="text-[#C31C2A]" />

              <div>
                <h2 className="font-semibold text-gray-900">
                  Requested Machines
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {enquiry.items.length}{" "}
                  {enquiry.items.length === 1 ? "machine item" : "machine items"}
                </p>
              </div>
            </div>

            {enquiry.items.length === 0 ? (
              <p className="text-sm text-gray-500">
                No machine items found for this enquiry.
              </p>
            ) : (
              <div className="space-y-4">
                {enquiry.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.machine_name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Model: {item.model_number}
                        </p>
                      </div>

                      <span className="w-fit rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                        Quantity: {item.quantity}
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <p className="text-xs font-medium text-gray-500">
                          Additional Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  );
}

export default EnquiryDetailsPage;
