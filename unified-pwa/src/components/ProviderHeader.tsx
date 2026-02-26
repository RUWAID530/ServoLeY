import React from 'react';
import { Search, Bell, HelpCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  currentView: string;
  isDesktop: boolean;
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  /**
   * Avatar URL for the logged-in provider.
   * This should come from the backend (user's uploaded profile photo).
   */
  avatarUrl?: string;
}

const ProviderHeaderComponent: React.FC<HeaderProps> = ({
  currentView,
  isDesktop,
  onMenuClick,
  isSidebarOpen = false,
  avatarUrl
}) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const prefersLight = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false;
  const isLightTheme = theme === 'light' || (theme === 'system' && prefersLight);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    Object.keys(localStorage)
      .filter((key) => key.startsWith('token_'))
      .forEach((key) => localStorage.removeItem(key));
    navigate('/auth');
  };

  const handleHelp = () => {
    navigate('/provider/settings');
  };

  const handleNotificationClick = () => {
    navigate('/provider/notification');
  };

  const handleThemeToggle = () => {
    setTheme(isLightTheme ? 'dark' : 'light');
  };

  // Use only the provider's avatar URL, no placeholders.
  const resolvedAvatar = (avatarUrl || '').trim();
  const headerBgClass = isLightTheme ? 'bg-white border-slate-200' : 'bg-[#0F1721] border-slate-800';
  const searchInputClass = isLightTheme
    ? 'w-full bg-slate-100 border border-slate-300 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors'
    : 'w-full bg-[#152233] border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors';

  if (isDesktop) {
    return (
      <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 z-10 ${headerBgClass}`}>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLightTheme ? 'text-slate-500' : 'text-slate-500'}`} size={18} />
            <input
              type="text"
              placeholder="Search services, customers..."
              className={searchInputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleThemeToggle}
            className={`flex items-center gap-2 mr-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-[#152233] hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isLightTheme ? <Moon size={17} /> : <Sun size={17} />}
            <span>{isLightTheme ? 'Dark' : 'Light'}</span>
          </button>

          <button
            onClick={handleNotificationClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isLightTheme
                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700'
                : 'bg-[#152B3C] hover:bg-[#1A374D] text-cyan-400'
            }`}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button
            onClick={handleHelp}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-[#152233] hover:bg-slate-700 text-slate-300'
            }`}
          >
            <HelpCircle size={18} />
            <span>Help</span>
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isLightTheme
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-[#152233] hover:bg-slate-700 text-slate-300'
            }`}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>

          <div className={`ml-2 w-8 h-8 rounded-full overflow-hidden border-2 ${isLightTheme ? 'border-slate-300 bg-slate-200' : 'border-slate-700 bg-slate-700'}`}>
            {resolvedAvatar && (
              <img
                src={resolvedAvatar}
                alt="Provider avatar"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </header>
    );
  }

  // Mobile Header
  return (
    <header className={`h-14 border-b flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 ${headerBgClass}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className={`p-2 rounded-md lg:hidden ${isLightTheme ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'}`}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="text-sm font-semibold">{isSidebarOpen ? 'X' : 'Menu'}</span>
        </button>
        <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <span className={`text-lg font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>ServoLey</span>
      </div>

      <div className="flex items-center gap-2">
        <button className={`p-2 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
          <Search size={20} />
        </button>
        <div className="relative">
          <button onClick={handleNotificationClick} className={`p-2 ${isLightTheme ? 'text-cyan-700' : 'text-cyan-400'}`}>
            <Bell size={20} />
          </button>
          <span className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border ${isLightTheme ? 'border-white' : 'border-[#0F1721]'}`}></span>
        </div>
        <button
          onClick={handleThemeToggle}
          className={`p-2 rounded-md ${isLightTheme ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'}`}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${isLightTheme ? 'border-slate-300 bg-slate-200' : 'border-slate-700 bg-slate-700'}`}>
          {resolvedAvatar && (
            <img
              src={resolvedAvatar}
              alt="Provider avatar"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export { ProviderHeaderComponent as ProviderHeader };
