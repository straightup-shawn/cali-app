import { NavLink, useLocation } from 'react-router-dom';

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
      {/* Dumbbell / bolt icon */}
      <path
        fillRule="evenodd"
        d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AICoachIcon({ className }: { className?: string }) {
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
        d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
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

// =============================================================================
// Nav items — 3 tabs only
// =============================================================================

const navItems = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: HomeIcon,
    size: 'normal' as const,
  },
  {
    to: '/ai-coach',
    label: 'AI',
    icon: AICoachIcon,
    size: 'normal' as const,
  },
  {
    to: '/workout',
    label: 'Workout',
    icon: WorkoutIcon,
    size: 'large' as const,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: ProfileIcon,
    size: 'normal' as const,
  },
];

// =============================================================================
// BottomNavigation — floating pill navbar
// =============================================================================

export default function BottomNavigation() {
  const location = useLocation();

  // Hide on the active workout page (full-screen experience)
  if (location.pathname === '/workout/active') {
    return null;
  }

  return (
    <nav
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      aria-label="Main navigation"
    >
      <ul
        className="flex items-center gap-1 rounded-full border border-white/10 bg-gray-900/80 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
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
                  `relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-4 py-2 transition-all duration-200 active:scale-95 ${
                    isLarge ? 'min-w-[64px]' : ''
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
                    {/* Active indicator dot */}
                    <span
                      className={`mt-0.5 h-1 w-1 rounded-full transition-all duration-200 ${
                        isActive ? 'bg-indigo-400 opacity-100' : 'opacity-0'
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
