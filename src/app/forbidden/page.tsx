import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-sm text-gray-500">
          You don&apos;t have permission to view this page. Contact your super
          admin if you need access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B94C5]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
