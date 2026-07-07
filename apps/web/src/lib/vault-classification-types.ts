import type { VaultCatalogObject } from "@/lib/vault-catalog-types";

export type VaultClassificationPatch = {
  category?: string | null;
  is_latest?: boolean;
  is_ignored?: boolean;
  is_processed?: boolean;
  is_hidden?: boolean;
};

export type VaultClassificationUpdateRequest = VaultClassificationPatch & {
  client_id: string;
  object_id: string;
};

export type VaultClassificationUpdateResponse = {
  object: VaultCatalogObject;
};
