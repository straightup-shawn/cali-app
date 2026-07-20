import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

export default function AppShell() {
  const location = useLocation();

  // Active workout page uses its own full-screen layout
  const isFullScreen = location.pathname === '/workout/active';

  return (
    <div className="min-h-screen">
      {/* Main content area — add bottom padding to prevent nav overlap on mobile */}
      <main className={isFullScreen ? '' : 'pb-20 md:pb-0'}>
        <Outlet />
      </main>

      {/* Bottom navigation — mobile only, hidden on desktop */}
      <BottomNavigation />
    </div>
  );
}
