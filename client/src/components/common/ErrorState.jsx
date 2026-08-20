export default function ErrorState({ message = 'Unable to load this data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose/20 bg-rose-light px-6 py-16 text-center">
      <p className="font-display text-sm font-semibold text-rose">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
