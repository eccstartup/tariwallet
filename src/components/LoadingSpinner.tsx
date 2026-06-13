export function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      <p className="text-sm text-gray-400 dark:text-gray-400">{text}</p>
    </div>
  );
}
