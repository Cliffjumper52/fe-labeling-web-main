export interface BaseEntityModel {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EntityReference {
  id: string;
}
