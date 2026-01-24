import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            badge2048
          </Link>
          <div className="flex gap-4">
            <Link
              href="/play"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Play
            </Link>
            <Link
              href="/badges"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Badges
            </Link>
            <Link
              href="/claim"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Claim
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
