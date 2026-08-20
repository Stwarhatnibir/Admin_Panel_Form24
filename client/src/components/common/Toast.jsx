import { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

// Minimal, self-contained toast - no external state manager needed since
// only one toast is shown at a time from any given page.
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-card ${
        isError ? 'border-rose/20 bg-white text-rose' : 'border-teal/20 bg-white text-teal'
      }`}
    >
      <Icon size={16} />
      {toast.message}
    </div>
  );
}
