import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-[#F4622F] mb-2">404</h1>
      <p className="text-[#4B5563] mb-6">This page could not be found.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 bg-[#F4622F] text-white rounded-lg font-medium hover:bg-[#FB6331] transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
