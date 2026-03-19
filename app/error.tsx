"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4 opacity-30">&#9888;</div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred while processing your request."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200 transition-all"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
