"use client";

import { useState, useTransition } from "react";
import { updatePromptAction } from "@/app/actions/admin";
import { SlidePanel } from "@/components/ui/slide-panel";
import type { PromptRecord } from "@/lib/admin-api-types";

type AdminPromptsViewProps = {
  prompts: PromptRecord[];
};

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AdminPromptsView({ prompts }: AdminPromptsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(prompts);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = items.find((p) => p.id === selectedId) ?? null;

  function handleSave(form: HTMLFormElement) {
    if (!selected) return;

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const body = String(formData.get("body") ?? "");

    setError(null);
    startTransition(async () => {
      try {
        await updatePromptAction(selected.id, { name, body });
        setItems((prev) =>
          prev.map((p) =>
            p.id === selected.id
              ? {
                  ...p,
                  name,
                  body,
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        );
        setSelectedId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

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

        {error ? (
          <div className="alert alert-warning py-2 small mb-0">{error}</div>
        ) : null}

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
              {items.map((prompt) => (
                <tr key={prompt.id}>
                  <td className="fw-medium">{prompt.name}</td>
                  <td>{prompt.version}</td>
                  <td>{formatUpdatedAt(prompt.updated_at)}</td>
                  <td>{prompt.updated_by ?? "—"}</td>
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSave(event.currentTarget);
            }}
          >
            <div className="mb-3">
              <label className="form-label" htmlFor="prompt-name">
                Display name
              </label>
              <input
                id="prompt-name"
                name="name"
                className="form-control"
                defaultValue={selected.name}
                required
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
                name="body"
                className="form-control font-monospace"
                rows={12}
                defaultValue={selected.body}
                required
              />
            </div>
            <div className="slide-panel-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedId(null)}
                disabled={pending}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? "Saving…" : "Save prompt"}
              </button>
            </div>
          </form>
        ) : null}
      </SlidePanel>
    </>
  );
}
