export type Role = "admin" | "manager" | "annotator" | "reviewer";

export type AccountStatus = "need_change_password" | "active" | "inactive";

export type ContentType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/svg+xml"
  | "text/plain"
  | "text/html"
  | "text/css"
  | "text/csv"
  | "text/xml"
  | "application/json"
  | "application/pdf"
  | "application/zip"
  | "application/gzip"
  | "application/octet-stream"
  | "audio/mpeg"
  | "audio/wav"
  | "audio/ogg"
  | "video/mp4"
  | "video/webm"
  | "video/ogg";

export type FileLabelStatus =
  | "in_progress"
  | "pending_review"
  | "reviewed"
  | "approved"
  | "rejected"
  | "done"
  | "reassigned";

export type AnswerType = "submit" | "rejected" | "approved" | "resubmitted";

export type ExportFormat = "csv" | "json" | "xml";

export type NotificationType =
  | "task_assigned"
  | "task_approved"
  | "task_rejected"
  | "system_alert";

export type ProjectStatus = "draft" | "active" | "completed" | "archived";

export type DataType = "image" | "text" | "video" | "audio";

export type ProjectTaskPriority = "low" | "medium" | "high";

export type ProjectTaskStatus =
  | "assigned"
  | "in_progress"
  | "pending_review"
  | "approved"
  | "rejected"
  | "done";

export type Decision = "approved" | "rejected" | "pending";

export type Severity =
  | "negligible"
  | "minor"
  | "moderate"
  | "major"
  | "critical";
