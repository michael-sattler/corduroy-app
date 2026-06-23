import { Shell } from "@/components/shell";

export default function ClientLoginPage() {
  return (
    <Shell surface="client" title="Sign in">
      <div className="max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-stone-600">
          Client authentication will connect to Supabase in milestone A4. For now,
          visit the dashboard directly while scaffolding is in progress.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-900"
        >
          Go to dashboard
        </a>
      </div>
    </Shell>
  );
}
