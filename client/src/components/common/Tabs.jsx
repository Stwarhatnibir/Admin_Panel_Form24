export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors ${
              active === tab.key
                ? 'border-accent text-slate-950'
                : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
