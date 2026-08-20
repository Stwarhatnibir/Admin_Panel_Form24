import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants/navigation';

// Placeholder for nav destinations whose build phase hasn't landed yet
// (see PHASES.md). Intentionally not a fake button - it's an honest page
// state, reached by navigating, not by an action that silently does nothing.
export default function ComingSoon() {
  const location = useLocation();
  const item = NAV_ITEMS.find((i) => location.pathname.startsWith(i.path));

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-24 text-center">
      <p className="font-display text-base font-semibold text-slate-950">{item?.label || 'This section'} is coming soon</p>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        This part of the admin panel is planned for a later build phase and hasn't been implemented yet.
      </p>
    </div>
  );
}
