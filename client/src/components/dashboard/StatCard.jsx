export default function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-slate-100 text-slate-700',
    accent: 'bg-accent-light text-accent-dark',
    teal: 'bg-teal-light text-teal',
    rose: 'bg-rose-light text-rose',
  };

  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 font-mono text-2xl font-medium text-slate-950">{value}</p>
      </div>
      {Icon && (
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
