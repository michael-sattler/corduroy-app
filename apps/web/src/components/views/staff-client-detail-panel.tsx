"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withImageCacheBuster } from "@/lib/platform-images-client";
import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";
import {
  STAFF_CLIENT_DETAIL_TABS,
  isStaffClientDetailTabKey,
  staffClientDetailTabTitle,
  type StaffClientDetailTabKey,
} from "@/lib/staff-client-detail-tabs";
import { StaffClientDashboardTab } from "@/components/views/staff-client-dashboard-tab";
import { StaffClientPlanAdminTab } from "@/components/views/staff-client-plan-admin-tab";
import { StaffClientPlanDashboardTab } from "@/components/views/staff-client-plan-dashboard-tab";

type StaffClientDetailPanelProps = {
  client: StaffDashboardClient | null;
  consultantName: string;
};

const TAB_QUERY_PARAM = "tab";

export function StaffClientDetailPanel({
  client,
  consultantName,
}: StaffClientDetailPanelProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<StaffClientDetailTabKey>(() => {
    const raw = searchParams.get(TAB_QUERY_PARAM);
    return raw && isStaffClientDetailTabKey(raw) ? raw : "dashboard";
  });

  // Keep the browser tab title and URL in sync with the active tab so each
  // view has a shareable URL (e.g. /dashboard?tab=plan) and a dedicated title.
  useEffect(() => {
    document.title = staffClientDetailTabTitle(activeTab);

    const url = new URL(window.location.href);
    if (activeTab === "dashboard") {
      url.searchParams.delete(TAB_QUERY_PARAM);
    } else {
      url.searchParams.set(TAB_QUERY_PARAM, activeTab);
    }
    window.history.replaceState(window.history.state, "", url);
  }, [activeTab]);

  // Reset to the dashboard tab when switching clients, but respect the tab
  // supplied via the URL on the initial mount.
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setActiveTab("dashboard");
  }, [client?.id]);

  if (!client) {
    return (
      <div className="app-card staff-dashboard-card">
        <h2 className="staff-dashboard-title mb-1">Select a client</h2>
        <p className="staff-dashboard-muted mb-0">
          Choose an organization from the list, or create one with{" "}
          <strong>Add client</strong>.
        </p>
      </div>
    );
  }

  const logoSrc = withImageCacheBuster(client.logo_path, client.logo_updated_at);

  return (
    <div className="p-4 staff-dashboard-card" key={client.id}>
      <div className="staff-dashboard-client-header">
        <div className="d-flex gap-2 align-items-center min-w-0">
          <span className="staff-client-avatar-lg">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" />
            ) : (
              client.initials
            )}
          </span>
          <div className="min-w-0">
            <h2 className="staff-dashboard-title mb-0 text-truncate">{client.name}</h2>
            <p className="staff-dashboard-subtitle text-body-secondary mb-0 text-truncate">
              {client.meta} · {consultantName}
            </p>
          </div>
        </div>
        <span className="badge staff-badge-on-track staff-dashboard-badge">Live</span>
      </div>

      <div className="staff-client-detail-tabs-wrap">
        <ul className="nav nav-tabs staff-client-detail-tabs" role="tablist">
          {STAFF_CLIENT_DETAIL_TABS.map((tab) => {
            const selected = activeTab === tab.key;

            return (
              <li key={tab.key} className="nav-item" role="presentation">
                <button
                  type="button"
                  id={`staff-client-tab-${tab.key}`}
                  className={`nav-link${selected ? " active" : ""}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`staff-client-tabpanel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        id="staff-client-tabpanel-dashboard"
        role="tabpanel"
        aria-labelledby="staff-client-tab-dashboard"
        hidden={activeTab !== "dashboard"}
      >
        {activeTab === "dashboard" ? (
          <StaffClientDashboardTab
            client={client}
            onOpenPlan={() => setActiveTab("plan")}
          />
        ) : null}
      </div>

      <div
        id="staff-client-tabpanel-plan"
        role="tabpanel"
        aria-labelledby="staff-client-tab-plan"
        hidden={activeTab !== "plan"}
      >
        {activeTab === "plan" ? (
          <StaffClientPlanDashboardTab
            clientId={client.id}
            clientName={client.name}
          />
        ) : null}
      </div>

      <div
        id="staff-client-tabpanel-admin"
        role="tabpanel"
        aria-labelledby="staff-client-tab-admin"
        hidden={activeTab !== "admin"}
      >
        {activeTab === "admin" ? <StaffClientPlanAdminTab client={client} /> : null}
      </div>
    </div>
  );
}
