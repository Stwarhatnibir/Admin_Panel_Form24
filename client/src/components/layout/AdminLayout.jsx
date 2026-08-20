import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NAV_ITEMS } from '../../constants/navigation';

export default function AdminLayout() {
  const location = useLocation();
  const activeItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={activeItem?.label || 'Scheme Admin'} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
