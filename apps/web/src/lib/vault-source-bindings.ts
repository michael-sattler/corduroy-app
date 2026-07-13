import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  VaultSourceBindingOption,
  VaultSourceBindingTags,
  VaultSourceBindingsResponse,
} from "@/lib/vault-source-binding-types";

type MetricDefinitionRef = { label: string | null };

type ClientMetricRow = {
  source_binding: string | null;
  is_active: boolean | null;
  metric_definitions: MetricDefinitionRef | MetricDefinitionRef[] | null;
};

type TagRow = {
  vault_object_id: string;
  source_binding: string;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Distinct source bindings across the client's active metrics, each with the
 * metrics that read from it. This is the tag palette shown in the vault drawer.
 */
export async function loadClientSourceBindingOptions(
  supabase: SupabaseClient,
  clientId: string,
): Promise<VaultSourceBindingOption[]> {
  const { data, error } = await supabase
    .from("client_metrics")
    .select("source_binding, is_active, metric_definitions ( label )")
    .eq("client_id", clientId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Source binding query failed: ${error.message}`);
  }

  const byBinding = new Map<string, Set<string>>();

  for (const row of (data ?? []) as ClientMetricRow[]) {
    const binding = row.source_binding?.trim();
    if (!binding) {
      continue;
    }

    const definition = firstOrValue(row.metric_definitions);
    const label = definition?.label?.trim();

    const labels = byBinding.get(binding) ?? new Set<string>();
    if (label) {
      labels.add(label);
    }
    byBinding.set(binding, labels);
  }

  return [...byBinding.entries()]
    .map(([value, labels]) => ({
      value,
      metricCount: labels.size,
      metricLabels: [...labels].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

/** Existing source-binding tags for every vault object of the client. */
export async function loadVaultSourceBindingTags(
  supabase: SupabaseClient,
  clientId: string,
): Promise<VaultSourceBindingTags> {
  const { data, error } = await supabase
    .from("vault_object_source_bindings")
    .select("vault_object_id, source_binding")
    .eq("client_id", clientId);

  if (error) {
    throw new Error(`Vault source binding tags query failed: ${error.message}`);
  }

  const tags: VaultSourceBindingTags = {};

  for (const row of (data ?? []) as TagRow[]) {
    const bucket = tags[row.vault_object_id] ?? [];
    bucket.push(row.source_binding);
    tags[row.vault_object_id] = bucket;
  }

  for (const key of Object.keys(tags)) {
    tags[key].sort((a, b) => a.localeCompare(b));
  }

  return tags;
}

export async function loadVaultSourceBindings(
  supabase: SupabaseClient,
  clientId: string,
): Promise<VaultSourceBindingsResponse> {
  const [options, tags] = await Promise.all([
    loadClientSourceBindingOptions(supabase, clientId),
    loadVaultSourceBindingTags(supabase, clientId),
  ]);

  return { options, tags };
}
