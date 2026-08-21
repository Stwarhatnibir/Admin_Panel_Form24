import { Plus, X } from 'lucide-react';

export default function DynamicListEditor({ label, items, onChange, placeholder }) {
  const updateItem = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));
  const addItem = () => onChange([...items, '']);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-950">{label}</span>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={placeholder}
              className="input-field flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 hover:text-rose"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1 text-xs font-medium text-accent-dark hover:underline">
        <Plus size={13} /> Add
      </button>
    </div>
  );
}
