import { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import BottomNavigation from './BottomNavigation';
import ActiveWorkoutBar from './ActiveWorkoutBar';
import PullToRefresh from '@/components/PullToRefresh';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';

export default function AppShell() {
  const location = useLocation();
  const { workout } = useActiveWorkout();
  const queryClient = useQueryClient();

  // Active workout page uses its own full-screen layout
  const isFullScreen = location.pathname === '/workout/active';

  // Show the active workout bar when a workout exists and we're NOT on the active workout page
  const showWorkoutBar = !!workout && !isFullScreen;

  // Pull-to-refresh: invalidate all queries to refetch data
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Status bar blur — fixed behind iOS status bar area */}
      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="h-full w-full backdrop-blur-lg" style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)', backdropFilter: 'blur(16px) saturate(180%)', background: 'var(--bg-header)' }} />
      </div>

      {/* Main content area — enough bottom padding to clear floating pill nav + safe area */}
      <PullToRefresh onRefresh={handleRefresh}>
        <main className={
          isFullScreen
            ? ''
            : showWorkoutBar
              ? 'animate-fade-in pb-44'
              : 'animate-fade-in pb-32'
        }>
          <Outlet />
        </main>
      </PullToRefresh>

      {/* Active workout mini-player bar — above bottom nav */}
      <ActiveWorkoutBar />

      {/* Bottom navigation — floating pill, mobile only */}
      <BottomNavigation />
    </div>
  );
}
