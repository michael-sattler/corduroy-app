import Link from "next/link";
import { Shell } from "@/components/shell";

export default function ClientLoginPage() {
  return (
    <Shell surface="client" title="Sign in">
      <div className="card shadow-sm" style={{ maxWidth: "28rem" }}>
        <div className="card-body p-4">
          <p className="text-body-secondary mb-4">
            Client authentication will connect to Supabase in milestone A4. For
            now, visit the dashboard directly while scaffolding is in progress.
          </p>
          <Link href="/dashboard" className="btn btn-warning">
            Go to dashboard
          </Link>
        </div>
      </div>
    </Shell>
  );
}
