type EyeIconProps = {
  isVisible: boolean;
};

export default function EyeIcon({ isVisible }: EyeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {isVisible ? (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1a9 9 0 0 1 10.1 6.9 9.3 9.3 0 0 1-3 4.3" />
          <path d="M6.1 6.1A9.3 9.3 0 0 0 2 12s3.5 6 10 6a9.8 9.8 0 0 0 4.4-1" />
        </>
      )}
    </svg>
  );
}
