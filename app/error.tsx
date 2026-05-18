"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-950">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4 opacity-30">&#9888;</div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-400 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          An unexpected error occurred while processing your request.
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
            className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
