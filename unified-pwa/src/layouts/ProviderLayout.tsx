import React from 'react';
import { Outlet } from 'react-router-dom';
import SideBar from '../components/SideBar';
import { ProviderHeader } from '../components/ProviderHeader';
import type { ViewType } from '../types/Index';
import { useProviderProfile } from '../contexts/ProviderProfileContext';
import { useTheme } from '../contexts/ThemeContext';

interface ProviderLayoutProps {
  showSidebar?: boolean;
  showHeader?: boolean;
  children?: React.ReactNode;
  currentView?: ViewType;
  setView?: (view: ViewType) => void;
}

const ProviderLayout: React.FC<ProviderLayoutProps> = ({
  showSidebar = true,
  showHeader = true,
  children,
  currentView = 'overview',
  setView = () => {}
}) => {
const { state: profileState } = useProviderProfile();
const { theme } = useTheme();
const [isMobile, setIsMobile] = React.useState(false);
const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
const prefersLight = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: light)').matches
  : false;
const isLightTheme = theme === 'light' || (theme === 'system' && prefersLight);

// Prefer avatar from shared provider profile; fall back to what was saved at signup/settings
let avatarUrl = profileState.profile?.profilePhoto || '';

if (!avatarUrl) {
  try {
    const userId = localStorage.getItem('userId');
    const saved = userId ? localStorage.getItem(`providerProfile:${userId}`) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.profilePhoto === 'string') {
        avatarUrl = parsed.profilePhoto;
      }
    }
  } catch {
    // ignore parse errors
  }
}

React.useEffect(() => {
  const checkViewport = () => {
    setIsMobile(window.innerWidth < 1024);
  };
  checkViewport();
  window.addEventListener('resize', checkViewport);
  return () => window.removeEventListener('resize', checkViewport);
}, []);

React.useEffect(() => {
  if (!isMobile) {
    setMobileSidebarOpen(false);
  }
}, [isMobile]);

const showDesktopSidebar = showSidebar && !isMobile;


  return (
    <div
      className={`provider-shell flex min-h-screen ${
        isLightTheme
          ? 'bg-slate-100 text-slate-900'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200'
      }`}
    >
      {showDesktopSidebar && <SideBar currentView={currentView} setView={setView} />}
      {showSidebar && isMobile && (
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-200 lg:hidden ${
            mobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div
            className={`absolute inset-y-0 left-0 transition-transform duration-200 ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SideBar
              currentView={currentView}
              setView={(view) => {
                setView(view);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        {showHeader && (
          <ProviderHeader
            currentView={currentView}
            isDesktop={!isMobile}
            onMenuClick={() => setMobileSidebarOpen((prev) => !prev)}
            isSidebarOpen={mobileSidebarOpen}
            avatarUrl={avatarUrl}
          />
        )}
        <div className="provider-content flex-1 overflow-auto">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default ProviderLayout;
