import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from '@/components/PublicRoute';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import { ResumeWorkoutPrompt } from '@/components/ResumeWorkoutPrompt';
import { ActiveWorkoutProvider } from '@/context/ActiveWorkoutContext';
import SyncToast from '@/components/SyncToast';
import { useSyncManager } from '@/hooks/useSyncManager';

// Lazy-loaded page components for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage'));
const ExerciseFormPage = lazy(() => import('@/pages/ExerciseFormPage'));
const ExerciseDetailPage = lazy(() => import('@/pages/ExerciseDetailPage'));
const RoutinesPage = lazy(() => import('@/pages/RoutinesPage'));
const RoutineFormPage = lazy(() => import('@/pages/RoutineFormPage'));
const ActiveWorkoutPage = lazy(() => import('@/pages/ActiveWorkoutPage'));
const WorkoutDetailPage = lazy(() => import('@/pages/WorkoutDetailPage'));
const WorkoutSummaryPage = lazy(() => import('@/pages/WorkoutSummaryPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const WorkoutHubPage = lazy(() => import('@/pages/WorkoutHubPage'));
const AICoachPage = lazy(() => import('@/pages/AICoachPage'));
const EditWorkoutPage = lazy(() => import('@/pages/EditWorkoutPage'));
const ProgressPage = lazy(() => import('@/pages/ProgressPage'));

/** Activates the sync manager hook within the component tree */
function SyncManager() {
  useSyncManager();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ActiveWorkoutProvider>
        <SyncManager />
        <SyncToast />
        <ResumeWorkoutPrompt />
        <Suspense fallback={<div className="h-screen bg-gray-950" />}>
        <Routes>
          {/* Public routes — redirect authenticated users to dashboard */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected routes — redirect unauthenticated users to login */}
          <Route element={<ProtectedRoute />}>
            {/* Onboarding sits outside the AppShell (no bottom nav) */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Workout summary sits outside AppShell (no bottom nav) */}
            <Route path="/workout/summary" element={<WorkoutSummaryPage />} />

            {/* App shell wraps all main app pages with bottom navigation */}
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Workout hub — primary nav tab */}
              <Route path="/workout" element={<WorkoutHubPage />} />
              <Route path="/ai-coach" element={<AICoachPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercises/new" element={<ExerciseFormPage />} />
              <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
              <Route path="/routines" element={<RoutinesPage />} />
              <Route path="/routines/new" element={<RoutineFormPage />} />
              <Route path="/routines/:id/edit" element={<RoutineFormPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<WorkoutDetailPage />} />
              <Route path="/history/:id/edit" element={<EditWorkoutPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/workout/active" element={<ActiveWorkoutPage />} />
            </Route>
          </Route>

          {/* Default route redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch-all redirects to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </ActiveWorkoutProvider>
    </BrowserRouter>
  );
}
