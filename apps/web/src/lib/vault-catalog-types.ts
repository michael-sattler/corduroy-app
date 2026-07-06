export type VaultCatalogObject = {
  id: string;
  s3_key: string;
  prefix: string;
  object_type: string;
  source: string;
  size_bytes: number | null;
  created_at: string;
};

export type VaultCatalogGroup = {
  source: string;
  label: string;
  items: VaultCatalogObject[];
};

export type VaultCatalogResponse = {
  objects: VaultCatalogObject[];
  groups: VaultCatalogGroup[];
  count: number;
};
