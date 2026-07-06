export type StaffClientUserRecord = {
  id: string;
  display_name: string;
  email: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
};

export type StaffClientRecord = {
  id: string;
  name: string;
  location: string;
  dateCreated: string;
  dateCreatedReadOnly: boolean;
  logoPath: string | null;
  logoUpdatedAt: string | null;
  users: StaffClientUserRecord[];
};
