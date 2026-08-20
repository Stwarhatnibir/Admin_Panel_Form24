import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

const ROLE_LABEL = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};

export default function Topbar({ title }) {
  const { admin, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="font-display text-lg font-semibold text-slate-950">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 font-display text-xs font-semibold text-white">
            {admin?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight text-slate-950">{admin?.name}</p>
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                admin?.role === ROLES.SUPER_ADMIN ? 'bg-accent-light text-accent-dark' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {ROLE_LABEL[admin?.role] || admin?.role}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          <LogOut size={15} />
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </header>
  );
}
