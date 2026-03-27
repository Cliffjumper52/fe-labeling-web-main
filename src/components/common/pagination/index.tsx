type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  size?: "sm" | "md";
};

function getPageWindow(current: number, total: number): number[] {
  if (total <= 0) return [];
  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, 5);
    else start = Math.max(1, end - 4);
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

const BASE =
  "flex items-center justify-center font-medium text-sm box-border border border-default-medium focus:outline-none";
const IDLE =
  "bg-neutral-secondary-medium text-body hover:bg-neutral-tertiary-medium hover:text-heading";
const ACTIVE = "bg-neutral-tertiary-medium text-fg-brand hover:text-fg-brand";
const DISABLED = "opacity-40 pointer-events-none";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  size = "sm",
}: Props) {
  if (totalPages <= 1) return null;

  const dim = size === "md" ? "w-10 h-10" : "w-9 h-9";
  const navDim = size === "md" ? "px-3 h-10" : "px-3 h-9";
  const pages = getPageWindow(currentPage, totalPages);

  return (
    <nav aria-label="Page navigation">
      <ul className="flex -space-x-px text-sm">
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${BASE} ${IDLE} rounded-s-lg ${navDim} ${currentPage <= 1 ? DISABLED : ""}`}
          >
            Previous
          </button>
        </li>

        {pages.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`${BASE} ${page === currentPage ? ACTIVE : IDLE} ${dim}`}
            >
              {page}
            </button>
          </li>
        ))}

        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`${BASE} ${IDLE} rounded-e-lg ${navDim} ${currentPage >= totalPages ? DISABLED : ""}`}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
