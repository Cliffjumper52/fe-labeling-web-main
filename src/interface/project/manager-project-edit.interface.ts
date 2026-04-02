export type ManagerProjectEditProject = {
  id: string;
  name: string;
  description?: string;
  status: "Drafting" | "Active" | "Archived" | "Completed";
  dataType: "Image" | "Video" | "Text" | "Audio";
  createdAt: string;
  imageUrl?: string;
  uploadedFiles?: string[];
  selectedPreset?: ManagerProjectEditPreset | null;
  assignedAnnotatorIds?: string[];
  assignedReviewerIds?: string[];
  annotatorFileAssignments?: Record<string, string[]>;
  reviewerFileAssignments?: Record<string, string[]>;
};

export type ManagerProjectEditPreset = {
  id: string;
  name: string;
  description?: string;
  labelIds: string[];
  createdAt: string;
};

export type ManagerProjectEditAvailableLabel = {
  id: string;
  name: string;
  description: string | undefined;
  color: string | undefined;
};

export type ManagerProjectEditTeamMember = {
  id: string;
  name: string;
  email: string;
  workload: string;
};

export type ManagerProjectEditUploadImageFile = {
  name: string;
  file: File;
};

export type ManagerProjectEditPaginationResult<T> = {
  data: T[];
  totalPages?: number;
  pageCount?: number;
};
