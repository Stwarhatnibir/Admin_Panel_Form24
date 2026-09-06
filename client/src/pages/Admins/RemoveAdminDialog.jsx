export default function RemoveAdminDialog({ admin, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-card">
        <p className="font-display text-base font-semibold text-slate-950">Remove Admin?</p>
        <p className="mt-2 text-sm text-slate-500">
          Are you sure you want to remove <span className="font-medium text-slate-950">{admin.name}</span>?
        </p>
        <p className="mt-1 text-sm text-slate-500">This will revoke admin access.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose/90"
          >
            Remove Admin
          </button>
        </div>
      </div>
    </div>
  );
}
