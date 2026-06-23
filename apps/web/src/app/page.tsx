import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-stone-100 px-6">
      <main className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-800">
          Corduroy Platform
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">
          Local development
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          This app serves two surfaces from one codebase. Use subdomain URLs in
          development — plain <code className="rounded bg-stone-100 px-1">localhost</code>{" "}
          shows this landing page.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li>
            <Link
              href="http://app.localhost:3000/dashboard"
              className="font-medium text-amber-900 hover:underline"
            >
              Client portal → app.localhost:3000
            </Link>
          </li>
          <li>
            <Link
              href="http://staff.localhost:3000/dashboard"
              className="font-medium text-stone-800 hover:underline"
            >
              Staff console → staff.localhost:3000
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
