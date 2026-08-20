import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileStack,
  Users,
  MessagesSquare,
  FolderLock,
  ClipboardList,
  CreditCard,
  RotateCcw,
  BellRing,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';

const ICONS = {
  dashboard: LayoutDashboard,
  applications: FileStack,
  users: Users,
  conversations: MessagesSquare,
  documents: FolderLock,
  schemes: ClipboardList,
  payments: CreditCard,
  refunds: RotateCcw,
  notifications: BellRing,
  audit: ScrollText,
  admins: ShieldCheck,
};

export default function Sidebar() {
  const { admin } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(admin?.role));

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-ink-900 text-white">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-ink-900">
          S
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-tight">Scheme Admin</p>
          <p className="text-[11px] text-white/40">Management console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {visibleItems.map((item) => {
          const Icon = ICONS[item.key];
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon size={17} strokeWidth={2} />
                  <span>{item.label}</span>
                  {!item.implemented && (
                    <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
                      soon
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-[11px] text-white/35">Signed in as</p>
        <p className="truncate text-sm font-medium">{admin?.name}</p>
      </div>
    </aside>
  );
}
