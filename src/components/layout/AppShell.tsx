import { Outlet, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import ActiveWorkoutBar from './ActiveWorkoutBar';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';

export default function AppShell() {
  const location = useLocation();
  const { workout } = useActiveWorkout();

  // Active workout page uses its own full-screen layout
  const isFullScreen = location.pathname === '/workout/active';

  // Show the active workout bar when a workout exists and we're NOT on the active workout page
  const showWorkoutBar = !!workout && !isFullScreen;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Main content area — enough bottom padding to clear nav + safe area + optional workout bar */}
      <main className={
        isFullScreen
          ? ''
          : showWorkoutBar
            ? 'pb-[calc(10rem+env(safe-area-inset-bottom))] md:pb-0'
            : 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0'
      }>
        <Outlet />
      </main>

      {/* Active workout mini-player bar — above bottom nav */}
      <ActiveWorkoutBar />

      {/* Bottom navigation — mobile only, hidden on desktop */}
      <BottomNavigation />
    </div>
  );
}
