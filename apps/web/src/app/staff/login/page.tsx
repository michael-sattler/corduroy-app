import Link from "next/link";
import { Shell } from "@/components/shell";

export default function StaffLoginPage() {
  return (
    <Shell surface="staff" title="Staff sign in">
      <div className="card shadow-sm" style={{ maxWidth: "28rem" }}>
        <div className="card-body p-4">
          <p className="text-body-secondary mb-4">
            Staff authentication will connect to Supabase in milestone A4.
            Corduroy staff (@corduroytech.ai) will sign in here once identity is
            wired up.
          </p>
          <Link href="/dashboard" className="btn btn-dark">
            Go to dashboard
          </Link>
        </div>
      </div>
    </Shell>
  );
}
