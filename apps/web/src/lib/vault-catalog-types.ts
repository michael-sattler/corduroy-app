export type VaultCatalogObject = {
  id: string;
  s3_key: string;
  prefix: string;
  object_type: string;
  source: string;
  size_bytes: number | null;
  created_at: string;
  category: string | null;
  is_latest: boolean;
  is_ignored: boolean;
  is_processed: boolean;
  is_hidden: boolean;
  classified_at: string | null;
  classified_by: string | null;
};

export type VaultCatalogGroup = {
  source: string;
  label: string;
  items: VaultCatalogObject[];
};

export type VaultCatalogResponse = {
  objects: VaultCatalogObject[];
  groups: VaultCatalogGroup[];
  hiddenGroups: VaultCatalogGroup[];
  count: number;
  visibleCount: number;
  hiddenCount: number;
  classificationReady: boolean;
};
