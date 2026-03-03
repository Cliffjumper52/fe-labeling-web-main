import {
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Link } from "react-router-dom";

type SubmissionStatus = "Pending Review" | "Approved" | "Returned";

type Submission = {
  id: string;
  projectName: string;
  dataset: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewer: string;
  note?: string;
  errorTypes?: string[];
};

const initialSubmissions: Submission[] = [
  {
    id: "task-101",
    projectName: "Street Scene Vehicles",
    dataset: "Urban-Cam-12",
    submittedAt: "2026-02-24",
    status: "Pending Review",
    reviewer: "Review Team A",
  },
  {
    id: "task-103",
    projectName: "Document Entities",
    dataset: "Contracts-Set-1",
    submittedAt: "2026-02-19",
    status: "Approved",
    reviewer: "Review Team B",
    note: "Consistent labels and clean spans."
  },
  {
    id: "task-102",
    projectName: "Medical Scan Classification",
    dataset: "CT-Slice-22",
    submittedAt: "2026-02-21",
    status: "Returned",
    reviewer: "Review Team C",
    note: "Missing hemorrhage labels for slices 14-20.",
    errorTypes: ["Missed label", "Incorrect class"],
  },
];

export default function AnnotatorSubmissionsPage() {
  const [submissions] = useState<Submission[]>(() => initialSubmissions);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(
    null,
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const handleOpenFeedback = (submission: Submission) => {
    setActiveSubmission(submission);
    setIsFeedbackOpen(true);
  };

  const closeWithAnimation = (
    key: string,
    closeFn: Dispatch<SetStateAction<boolean>>,
  ) => {
    setClosingModals((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      closeFn(false);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 200);
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Submissions</h2>
          <p className="text-sm text-gray-500">
            Track review outcomes and respond to returned tasks.
          </p>
        </div>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.7fr_1.3fr_0.9fr_0.9fr_1fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Project</span>
          <span>Dataset</span>
          <span>Status</span>
          <span>Submitted</span>
          <span>Action</span>
        </div>

        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="grid grid-cols-[1.7fr_1.3fr_0.9fr_0.9fr_1fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
          >
            <div>
              <p className="font-medium text-gray-800">
                {submission.projectName}
              </p>
              <p className="text-xs text-gray-500">
                Reviewer: {submission.reviewer}
              </p>
            </div>
            <p className="text-sm text-gray-600">{submission.dataset}</p>
            <span
              className={`rounded-md px-3 py-1 text-xs font-semibold ${
                submission.status === "Approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : submission.status === "Returned"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {submission.status}
            </span>
            <span className="text-gray-600">{submission.submittedAt}</span>
            <div className="flex items-center gap-3 text-sm font-semibold">
              {submission.status === "Returned" && (
                <Link
                  to={`/annotator/workspace/${submission.id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Fix & Resubmit
                </Link>
              )}
              <button
                type="button"
                onClick={() => handleOpenFeedback(submission)}
                className="text-blue-600 hover:text-blue-700"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {isFeedbackOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.feedback ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Review Result
              </h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("feedback", setIsFeedbackOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 p-4 text-sm text-gray-700">
              <div>
                <p className="text-xs font-semibold text-gray-500">Status</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {activeSubmission.status}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Reviewer note
                </p>
                <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  {activeSubmission.note ||
                    "No additional note was provided."}
                </p>
              </div>
              {activeSubmission.errorTypes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500">
                    Error categories
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeSubmission.errorTypes.map((item) => (
                      <span
                        key={item}
                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
