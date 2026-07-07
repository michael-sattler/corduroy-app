import categories from "@/config/vault-categories.json";

export type VaultCategoryOption = {
  id: string;
  label: string;
};

export const VAULT_CATEGORIES = categories as VaultCategoryOption[];

export function vaultCategoryLabel(categoryId: string | null | undefined): string | null {
  if (!categoryId?.trim()) {
    return null;
  }

  return VAULT_CATEGORIES.find((option) => option.id === categoryId)?.label ?? categoryId;
}

export function isValidVaultCategory(categoryId: string | null | undefined): boolean {
  if (categoryId == null || categoryId === "") {
    return true;
  }

  return VAULT_CATEGORIES.some((option) => option.id === categoryId);
}
