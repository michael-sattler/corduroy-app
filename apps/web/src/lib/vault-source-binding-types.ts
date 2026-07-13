/**
 * A source binding a client's KPIs read from, offered as a tag option for
 * vault files. Derived from the distinct `client_metrics.source_binding`
 * values across the client's active metrics.
 */
export type VaultSourceBindingOption = {
  value: string;
  metricCount: number;
  metricLabels: string[];
};

/** Map of vault object id → source bindings currently tagged on it. */
export type VaultSourceBindingTags = Record<string, string[]>;

export type VaultSourceBindingsResponse = {
  options: VaultSourceBindingOption[];
  tags: VaultSourceBindingTags;
};

export type VaultSourceBindingUpdateRequest = {
  client_id: string;
  object_id: string;
  source_bindings: string[];
};

export type VaultSourceBindingUpdateResponse = {
  object_id: string;
  source_bindings: string[];
};
