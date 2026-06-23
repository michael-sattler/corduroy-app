import Link from "next/link";

type ShellProps = {
  surface: "client" | "staff";
  title: string;
  children: React.ReactNode;
};

const surfaceConfig = {
  client: {
    label: "Client Portal",
    navbarClass: "navbar-client",
  },
  staff: {
    label: "Staff Console",
    navbarClass: "navbar-staff",
  },
} as const;

export function Shell({ surface, title, children }: ShellProps) {
  const config = surfaceConfig[surface];

  return (
    <div className="d-flex flex-column min-vh-100 bg-body-secondary">
      <header>
        <nav
          className={`navbar navbar-expand navbar-dark ${config.navbarClass}`}
        >
          <div className="container">
            <div className="navbar-brand mb-0">
              <div className="small text-uppercase opacity-75">Corduroy</div>
              <div className="fw-semibold">{config.label}</div>
            </div>
            <ul className="navbar-nav ms-auto flex-row gap-3">
              <li className="nav-item">
                <Link href="/dashboard" className="nav-link">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/login" className="nav-link">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      <main className="container py-5 surface-main">
        <h1 className="h2 mb-4">{title}</h1>
        {children}
      </main>
    </div>
  );
}
