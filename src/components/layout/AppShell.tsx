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
      {/* Main content area — enough bottom padding to clear floating pill nav + safe area */}
      <main className={
        isFullScreen
          ? ''
          : showWorkoutBar
            // floating pill (~80px) + workout bar (~64px) + extra breathing room
            ? 'animate-fade-in pb-36'
            // floating pill height (~80px) + generous breathing room = pb-28
            : 'animate-fade-in pb-28'
      }>
        <Outlet />
      </main>

      {/* Active workout mini-player bar — above bottom nav */}
      <ActiveWorkoutBar />

      {/* Bottom navigation — floating pill, mobile only */}
      <BottomNavigation />
    </div>
  );
}
