import { Shell } from "@/components/shell";

export default function StaffLoginPage() {
  return (
    <Shell surface="staff" title="Staff sign in">
      <div className="max-w-md rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-stone-600">
          Staff authentication will connect to Supabase in milestone A4. Corduroy
          staff (@corduroytech.ai) will sign in here once identity is wired up.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-stone-50 hover:bg-stone-900"
        >
          Go to dashboard
        </a>
      </div>
    </Shell>
  );
}
