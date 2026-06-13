import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: { label: string; to?: string; onClick?: () => void };
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {description}
      </p>
      {action &&
        (action.to ? (
          <Link
            to={action.to}
            className="mt-2 px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-2 px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
