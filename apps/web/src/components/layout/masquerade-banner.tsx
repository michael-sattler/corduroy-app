import type { MasqueradeSession } from "@/lib/impersonation";

type MasqueradeBannerProps = {
  session: MasqueradeSession;
  endHref: string;
};

export function MasqueradeBanner({ session, endHref }: MasqueradeBannerProps) {
  return (
    <div
      className="masquerade-banner"
      role="status"
      aria-live="polite"
    >
      <div className="masquerade-banner-inner">
        <span>
          Logged in as{" "}
          <strong>{session.clientDisplayName}</strong>
          {session.clientEmail ? ` (${session.clientEmail})` : null}
          <span className="masquerade-banner-meta">
            {" "}
            — staff support view by {session.staffDisplayName}
          </span>
        </span>
        <a href={endHref} className="btn btn-sm btn-light masquerade-banner-action">
          End client session
        </a>
      </div>
    </div>
  );
}
