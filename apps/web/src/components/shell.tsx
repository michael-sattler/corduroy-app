import Link from "next/link";

type ShellProps = {
  surface: "client" | "staff";
  title: string;
  children: React.ReactNode;
};

const surfaceConfig = {
  client: {
    label: "Client Portal",
    accent: "bg-amber-800",
    accentText: "text-amber-50",
    navHref: "/dashboard",
  },
  staff: {
    label: "Staff Console",
    accent: "bg-stone-800",
    accentText: "text-stone-50",
    navHref: "/dashboard",
  },
} as const;

export function Shell({ surface, title, children }: ShellProps) {
  const config = surfaceConfig[surface];

  return (
    <div className="flex min-h-full flex-col bg-stone-100">
      <header className={`${config.accent} ${config.accentText}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest opacity-80">
              Corduroy
            </p>
            <p className="text-sm font-semibold">{config.label}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={config.navHref} className="opacity-90 hover:opacity-100">
              Dashboard
            </Link>
            <Link href="/login" className="opacity-90 hover:opacity-100">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
