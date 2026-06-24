"use client";

import { useState } from "react";
import { SlidePanel } from "@/components/ui/slide-panel";
import { adminPrompts } from "@/lib/placeholder-admin-data";

export function AdminPromptsView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = adminPrompts.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h1 className="h4 mb-1">Prompt library</h1>
            <p className="text-body-secondary mb-0">
              Prompts are stored in the database so staff can tune model behavior
              without deployments.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" disabled>
            New prompt
          </button>
        </div>

        <div className="app-card p-0 overflow-hidden">
          <table className="table table-hover mb-0 admin-data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Last updated</th>
                <th>Updated by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {adminPrompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td className="fw-medium">{prompt.name}</td>
                  <td>{prompt.version}</td>
                  <td>{prompt.updatedAt}</td>
                  <td>{prompt.updatedBy}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSelectedId(prompt.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? "Edit prompt"}
        subtitle={selected ? `${selected.version} · ${selected.id}` : undefined}
        size="lg"
      >
        {selected ? (
          <>
            <div className="mb-3">
              <label className="form-label" htmlFor="prompt-name">
                Display name
              </label>
              <input
                id="prompt-name"
                className="form-control"
                defaultValue={selected.name}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="prompt-key">
                Key
              </label>
              <input
                id="prompt-key"
                className="form-control font-monospace"
                defaultValue={selected.id}
                readOnly
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="prompt-body">
                Prompt body
              </label>
              <textarea
                id="prompt-body"
                className="form-control font-monospace"
                rows={12}
                defaultValue={`You are Corduroy's ${selected.name} assistant...\n\n[Placeholder prompt content — will load from database]`}
              />
            </div>
            <div className="slide-panel-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedId(null)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary">
                Save prompt
              </button>
            </div>
          </>
        ) : null}
      </SlidePanel>
    </>
  );
}
