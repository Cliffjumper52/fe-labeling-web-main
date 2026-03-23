import api from "../api/axios";

// ============ Type Definitions ============

/** Review decision type */
export type ReviewDecision = "approved" | "rejected" | "pending";

/** Priority level for UI display */
export type UiTaskPriority = "Low" | "Normal" | "High";

/** Task status for UI display */
export type UiTaskStatus = "In Progress" | "Pending Review" | "Returned" | "Completed";

/** Review task that needs to be reviewed */
export interface ReviewerTask {
  id: string;
  projectName: string;
  dataset: string;
  status: UiTaskStatus;
  priority: UiTaskPriority;
  assignedAt: string; // ISO 8601 date
  dueAt: string; // ISO 8601 date
  preset: string;
  progress: number; // 0-100 percentage
  annotatorName?: string;
  submittedAt?: string;
}

/** Review error type for feedback */
export interface ReviewError {
  type: string;
  severity: "Low" | "Medium" | "High";
  description: string;
}

/** Reviewer statistics */
export interface ReviewerStats {
  totalReviews: number;
  approved: number;
  rejected: number;
  approvalRate: number; // percentage
  averageTimePerReview: number; // minutes
}

// ============ Backend Response Types ============

interface BackendProjectTask {
  id: string;
  projectId: string;
  status: string; // "assigned" | "in_progress" | "pending_review" | "approved" | "rejected" | "done"
  priority: string; // "low" | "medium" | "high"
  assignedTo: string;
  assignedBy: string;
  assignedAt?: string;
  submittedAt?: string;
  startedAt?: string;
  completedAt?: string;
  project?: {
    name: string;
  };
  fileIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface BackendReview {
  id: string;
  fileLabelId: string;
  reviewerId: string;
  decision: ReviewDecision;
  feedbacks?: string;
  reviewedAt?: string;
  checklistAnswerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationDto<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============ Helper Functions ============

/** Map backend priority enum to UI priority */
function mapPriority(backendPriority?: string): UiTaskPriority {
  const priority = backendPriority?.toLowerCase() ?? "medium";
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  return "Normal"; // default to medium/normal
}

/** Map backend status enum to UI status */
function mapStatus(backendStatus?: string): UiTaskStatus {
  const status = backendStatus?.toLowerCase() ?? "in_progress";
  if (status === "pending_review") return "Pending Review";
  if (status === "approved" || status === "done") return "Completed";
  if (status === "rejected") return "Returned";
  return "In Progress"; // default
}

/** Format date to YYYY-MM-DD */
function toDate(dateStr?: string | Date): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toISOString().slice(0, 10);
}

/** Unwrap nested API response { data: T } structure */
function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

// ============ API Functions ============

/**
 * Fetch tasks that need to be reviewed by current reviewer
 * Tasks are those with status "pending_review" assigned to the reviewer
 */
export async function getReviewerCurrentTasks(
  page: number = 1,
  limit: number = 20,
): Promise<ReviewerTask[]> {
  try {
    const response = await api.get("/project-tasks/current-user", {
      params: {
        limit,
        page,
        status: "pending_review", // Only fetch pending review tasks
      },
    });

    const paginatedData = unwrapData<PaginationDto<BackendProjectTask>>(response.data);
    const tasks = paginatedData.data || [];

    return tasks
      .filter((task) => task.status?.toLowerCase() === "pending_review")
      .map((task) => ({
        id: task.id,
        projectName: task.project?.name ?? "Unknown Project",
        dataset: "", // Will be fetched separately if needed
        status: mapStatus(task.status),
        priority: mapPriority(task.priority),
        assignedAt: toDate(task.assignedAt),
        dueAt: toDate(task.completedAt || task.assignedAt),
        preset: "Default", // Not in task entity
        progress: 100, // Submitted tasks are 100% complete
        submittedAt: toDate(task.submittedAt),
      }));
  } catch (error) {
    console.error("Error fetching reviewer tasks:", error);
    throw error;
  }
}

/**
 * Fetch a specific task by ID for detailed review
 */
export async function getReviewerTaskById(id: string): Promise<ReviewerTask> {
  try {
    const response = await api.get(`/project-tasks/${id}`);
    const task = unwrapData<BackendProjectTask>(response.data);

    return {
      id: task.id,
      projectName: task.project?.name ?? "Unknown Project",
      dataset: "", // Not directly in task
      status: mapStatus(task.status),
      priority: mapPriority(task.priority),
      assignedAt: toDate(task.assignedAt),
      dueAt: toDate(task.completedAt || task.assignedAt),
      preset: "Default",
      progress: 100,
      submittedAt: toDate(task.submittedAt),
    };
  } catch (error) {
    console.error(`Error fetching reviewer task ${id}:`, error);
    throw error;
  }
}

/**
 * Submit a review (approve or reject) for a task
 * Calls POST /reviews/reviewer/submit with decision and feedback
 */
export async function submitReviewerDecision(
  taskId: string,
  decision: "Approved" | "Rejected",
  feedbackText: string,
  errors: ReviewError[],
): Promise<void> {
  try {
    const decisionValue = decision === "Approved" ? "approved" : "rejected";

    const payload = {
      fileLabelId: taskId, // Using taskId as file label ID reference
      decision: decisionValue,
      feedbacks: feedbackText || "",
      reviewErrors: errors.map((e) => ({
        type: e.type,
        severity: e.severity,
        description: e.description,
      })),
    };

    await api.post("/reviews/reviewer/submit", payload);
  } catch (error) {
    console.error("Error submitting review decision:", error);
    throw error;
  }
}

/**
 * Fetch reviewer statistics (approval rate, total reviews, etc.)
 */
export async function getReviewerStats(reviewerId: string): Promise<ReviewerStats> {
  try {
    const response = await api.get("/reviews/reviewer/stats", {
      params: { reviewerId },
    });

    const stats = unwrapData<{
      totalReviews: number;
      approved: number;
      rejected: number;
      approvalRate?: number;
      averageReviewTime?: number;
    }>(response.data);

    const total = stats.totalReviews || 0;
    const approved = stats.approved || 0;
    const rejected = stats.rejected || 0;

    return {
      totalReviews: total,
      approved,
      rejected,
      approvalRate: stats.approvalRate ?? (total > 0 ? (approved / total) * 100 : 0),
      averageTimePerReview: stats.averageReviewTime ?? 0,
    };
  } catch (error) {
    console.error("Error fetching reviewer stats:", error);
    // Return default empty stats on error
    return {
      totalReviews: 0,
      approved: 0,
      rejected: 0,
      approvalRate: 0,
      averageTimePerReview: 0,
    };
  }
}

/**
 * Fetch all reviews with pagination for reports
 */
export async function getReviewerReviews(
  page: number = 1,
  limit: number = 50,
): Promise<BackendReview[]> {
  try {
    const response = await api.get("/reviews", {
      params: { page, limit },
    });

    const paginatedData = unwrapData<PaginationDto<BackendReview>>(response.data);
    return paginatedData.data || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
}
