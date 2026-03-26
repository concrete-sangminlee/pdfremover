import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-slate-950">
      <div className="text-center animate-fadeInUp">
        <div className="text-6xl mb-4 opacity-30">&#128196;</div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-gray-400 dark:text-slate-400 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
        >
          Go to FileForge
        </Link>
      </div>
    </div>
  );
}
