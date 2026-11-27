
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {message && (
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
