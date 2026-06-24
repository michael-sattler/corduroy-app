import Link from "next/link";
import {
  clientNavItems,
  staffNavItems,
  type AppSurface,
  type ClientNavKey,
  type StaffNavKey,
} from "@/components/layout/nav-config";

type TopNavProps =
  | {
      surface: "client";
      active: ClientNavKey;
    }
  | {
      surface: "staff";
      active: StaffNavKey;
    };

export function TopNav(props: TopNavProps) {
  if (props.surface === "client") {
    return (
      <nav className="app-nav-pills d-none d-md-flex" aria-label="Client">
        {clientNavItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={navPillClass("client", item.key === props.active, item.disabled)}
            aria-current={item.key === props.active ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="app-nav-pills d-none d-lg-flex" aria-label="Staff">
      {staffNavItems.map((item) => (
        <NavItemStaff
          key={item.key}
          item={item}
          active={item.key === props.active}
        />
      ))}
    </nav>
  );
}

function NavItemStaff({
  item,
  active,
}: {
  item: (typeof staffNavItems)[number];
  active: boolean;
}) {
  const className = navPillClass("staff", active, item.disabled);

  if (item.disabled) {
    return <span className={className}>{item.label}</span>;
  }

  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {item.label}
    </Link>
  );
}

function navPillClass(
  surface: AppSurface,
  active: boolean,
  disabled?: boolean,
): string {
  const parts = ["app-nav-pill"];
  if (surface === "staff") {
    parts.push("app-nav-pill-staff");
  }
  if (active) {
    parts.push("active");
  }
  if (disabled) {
    parts.push("disabled");
  }
  return parts.join(" ");
}
