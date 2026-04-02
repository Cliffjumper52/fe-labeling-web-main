type Props = {
  onCreateClick: () => void;
};

export default function ProjectsHeader({ onCreateClick }: Props) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          New Project
        </button>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />
    </>
  );
}
