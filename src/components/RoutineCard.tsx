import { useState } from 'react';
import { Link } from 'react-router-dom';

interface RoutineCardProps {
  id: string;
  name: string;
  exerciseCount: number;
  updatedAt: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function RoutineCard({
  id,
  name,
  exerciseCount,
  updatedAt,
  onDelete,
  onDuplicate,
}: RoutineCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDelete() {
    setMenuOpen(false);
    const confirmed = window.confirm(
      `Delete "${name}"? This action cannot be undone.`
    );
    if (confirmed) {
      onDelete(id);
    }
  }

  function handleDuplicate() {
    setMenuOpen(false);
    onDuplicate(id);
  }

  const formattedDate = new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors">
      <Link
        to={`/routines/${id}/edit`}
        className="block active:bg-gray-800 transition-colors"
        aria-label={`View routine: ${name}`}
      >
        <div className="flex items-start justify-between gap-2 pr-8">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-medium text-gray-100">
              {name}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
              <span>
                {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
              </span>
              <span className="text-gray-600">•</span>
              <span>Updated {formattedDate}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Context menu button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-800 hover:text-gray-300 active:bg-gray-700 transition-colors"
        aria-label={`Options for ${name}`}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-3 top-12 z-20 w-40 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-lg">
            <button
              type="button"
              onClick={handleDuplicate}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Duplicate
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-950 active:bg-red-900 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
