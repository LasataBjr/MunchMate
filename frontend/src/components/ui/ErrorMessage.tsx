
import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

type ErrorMessageProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

function ErrorMessage({
  title = "Something went wrong",
  message = "We couldn't complete your request. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  className = "",
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-red-50 p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-red-800">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-red-700">
            {message}
          </p>

          {onRetry && (
            <Button
              variant="danger"
              size="sm"
              onClick={onRetry}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;
