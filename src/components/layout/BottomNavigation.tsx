import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { isProgressionEnabled } from '@/lib/feature-flags';

// =============================================================================
// Icon components
// =============================================================================

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.97-.97V19.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-3.75h-3v3.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-6.568l-.97.969a.75.75 0 1 1-1.06-1.06l8.69-8.69Z" />
    </svg>
  );
}

function WorkoutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ProgressIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a.75.75 0 0 0 0 1.5h12.17a.75.75 0 0 0 0-1.5h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.707 6.707 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// =============================================================================
// Nav items — base items + conditional progress tab
// =============================================================================

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  size: 'normal' | 'large';
}

const baseNavItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: HomeIcon,
    size: 'normal',
  },
  {
    to: '/workout',
    label: 'Workout',
    icon: WorkoutIcon,
    size: 'large',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: ProfileIcon,
    size: 'normal',
  },
];

const progressNavItem: NavItem = {
  to: '/progress',
  label: 'Progress',
  icon: ProgressIcon,
  size: 'normal',
};

// =============================================================================
// Pages where nav should be completely hidden
// =============================================================================

function shouldHideNav(pathname: string): boolean {
  // Active workout (full-screen)
  if (pathname === '/workout/active') return true;
  // Workout detail / editing history
  if (pathname.startsWith('/history/')) return true;
  // AI Coach page
  if (pathname === '/ai-coach') return true;
  return false;
}

// =============================================================================
// Auto-hide timeout (ms)
// =============================================================================

const HIDE_DELAY = 3000;

// =============================================================================
// BottomNavigation — floating pill navbar with auto-hide
// =============================================================================

export default function BottomNavigation() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build nav items list — include Progress tab when feature is enabled
  const navItems = useMemo(() => {
    if (isProgressionEnabled()) {
      // Insert Progress before Profile (Home, Workout, Progress, Profile)
      return [baseNavItems[0], baseNavItems[1], progressNavItem, baseNavItems[2]];
    }
    return baseNavItems;
  }, []);

  // Reset visibility on route change
  useEffect(() => {
    setVisible(true);
    startHideTimer();
    return () => clearHideTimer();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for touch/scroll activity to show nav
  useEffect(() => {
    function handleActivity() {
      setVisible(true);
      startHideTimer();
    }

    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('pointermove', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('pointermove', handleActivity);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startHideTimer() {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, HIDE_DELAY);
  }

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  // Completely hidden on certain pages
  if (shouldHideNav(location.pathname)) {
    return null;
  }

  return (
    <nav
      className={`fixed left-1/2 z-50 -translate-x-1/2 md:hidden transition-all duration-500 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      aria-label="Main navigation"
    >
      <ul
        className={`flex items-center rounded-full border border-white/10 bg-gray-900/80 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl ${
          navItems.length > 3 ? 'gap-0.5' : 'gap-1'
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLarge = item.size === 'large';

          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                aria-label={item.label}
                className={({ isActive }) =>
                  `relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-full py-2 transition-all duration-200 active:scale-95 ${
                    isLarge ? 'min-w-[60px] px-3' : 'min-w-[52px] px-3'
                  } ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={isLarge ? 'h-7 w-7' : 'h-6 w-6'} />
                    <span
                      className={`mt-0.5 h-1 w-1 rounded-full transition-all duration-200 ${
                        isActive ? 'dot-accent opacity-100' : 'opacity-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
