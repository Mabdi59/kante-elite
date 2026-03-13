import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 mb-4">404</div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you requested does not exist or may have moved. Use the links below to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="lift-button rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-600">
            Return Home
          </Link>
          <Link href="/programs" className="lift-button rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50">
            View Programs
          </Link>
        </div>
      </div>
    </section>
  )
}
