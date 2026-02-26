
import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Briefcase, 
  ClipboardList,
  Users, 
  Star, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Wallet,
  ChevronLeft
} from 'lucide-react';
import { ViewType } from '../types/Index';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const SideBar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { theme } = useTheme();
  const prefersLight = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false;
  const isLightTheme = theme === 'light' || (theme === 'system' && prefersLight);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'Main' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, section: 'Main' },
    { id: 'bookings', label: 'Bookings', icon: ClipboardList, section: 'Main' },
    { id: 'services', label: 'Services', icon: Briefcase, section: 'Main' },
    { id: 'customers', label: 'Customers', icon: Users, section: 'Main' },
    { id: 'reviews', label: 'Reviews', icon: Star, section: 'Main' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, section: 'Main' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, section: 'Account' },
    { id: 'payouts', label: 'Payouts', icon: Wallet, section: 'Account' },
  ];

  return (
    <aside
      className={`w-64 border-r flex flex-col shrink-0 ${
        isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>ServoLey</span>
        </div>
        <button className={isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-500 hover:text-white'}>
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-6">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 ${isLightTheme ? 'text-slate-500' : 'text-slate-500'}`}>Main</p>
          {menuItems.filter(i => i.section === 'Main').map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1 ${
                currentView === item.id 
                  ? (isLightTheme ? 'bg-cyan-50 text-cyan-700 font-medium' : 'bg-[#152B3C] text-cyan-400 font-medium')
                  : (isLightTheme ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800')
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 ${isLightTheme ? 'text-slate-500' : 'text-slate-500'}`}>Account</p>
          {menuItems.filter(i => i.section === 'Account').map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors mb-1 ${
                currentView === item.id 
                  ? (isLightTheme ? 'bg-cyan-50 text-cyan-700 font-medium' : 'bg-[#152B3C] text-cyan-400 font-medium')
                  : (isLightTheme ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800')
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className={`mt-8 p-4 rounded-xl relative overflow-hidden group cursor-pointer ${isLightTheme ? 'bg-slate-100 border border-slate-200' : 'bg-[#152B3C]'}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full -mr-8 -mt-8" />
          <h4 className={`text-sm font-semibold mb-1 ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>Boost your profile</h4>
          <p className={`text-xs mb-4 leading-relaxed ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Get more bookings with featured placement.</p>
          <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-[#0F1721] text-xs font-bold py-2 rounded-lg transition-colors uppercase">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SideBar;
