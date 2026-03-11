import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  Headset,
  Home,
  Search,
  Sparkles,
  User,
  Wallet,
  Wrench,
  Zap
} from 'lucide-react';

interface CustomerDashboardProps {
  onNavigate?: (page: string) => void;
}

type CategoryId = 'all' | 'cleaning' | 'plumbing';

type BottomTabId = 'home' | 'bookings' | 'wallet' | 'support/dashboard' | 'profile';

const categoryPills: Array<{
  id: CategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'all', label: 'All', icon: Zap },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles },
  { id: 'plumbing', label: 'Plumbing', icon: Wrench }
];

const providerCards = [
  {
    name: 'David Chen',
    role: 'Master Plumber',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=360&q=80'
  },
  {
    name: 'Sarah Miller',
    role: 'Home Expert',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=360&q=80'
  },
  {
    name: 'James Ward',
    role: 'Electrician',
    image:
      'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=360&q=80'
  }
];

const famousServices = [
  {
    name: 'Laundry',
    image:
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=320&q=80'
  },
  {
    name: 'Pest Control',
    image:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=320&q=80'
  },
  {
    name: 'Repair',
    image:
      'https://images.unsplash.com/photo-1581579188871-45ea61f2a1bd?auto=format&fit=crop&w=320&q=80'
  },
  {
    name: 'Painting',
    image:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=320&q=80'
  }
];

const bottomTabs: Array<{
  id: BottomTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'bookings', label: 'Service', icon: Calendar },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'support/dashboard', label: 'Support', icon: Headset },
  { id: 'profile', label: 'Profile', icon: User }
];

export default function CustomerDashboardModern({ onNavigate }: CustomerDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');

  const userName = useMemo(() => {
    const fromStorage = localStorage.getItem('userName') || localStorage.getItem('name');
    return fromStorage && fromStorage.trim().length > 0 ? fromStorage : 'Alex Johnson';
  }, []);

  const routePath = typeof window !== 'undefined' ? window.location.pathname : '/customer/home';
  const activeTab: BottomTabId =
    routePath.includes('/customer/bookings')
      ? 'bookings'
      : routePath.includes('/customer/wallet')
        ? 'wallet'
        : routePath.includes('/customer/support')
          ? 'support/dashboard'
          : routePath.includes('/customer/profile')
            ? 'profile'
            : 'home';

  const filteredProviders =
    selectedCategory === 'plumbing'
      ? providerCards.filter((provider) => provider.role.toLowerCase().includes('plumber'))
      : providerCards;

  const navigateCustomer = (path: BottomTabId | 'services') => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }

    const normalizedPath = path === 'home' ? '/customer/home' : `/customer/${path}`;
    window.location.href = normalizedPath;
  };

  return (
    <div className="min-h-screen bg-[#f1f3f5] pb-28 text-[#0f172a]">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[#0d95bd] bg-[#e3f4f9]">
              <img
                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=80"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-500">Welcome back,</p>
              <p className="truncate text-2xl font-semibold leading-none text-slate-900 sm:text-3xl">{userName}</p>
            </div>
          </div>

          <button
            type="button"
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0d95bd] shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-7 px-4 py-6">
        <section>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
            <Search className="h-5 w-5 text-[#0d95bd]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="What service do you need today?"
              className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400 sm:text-xl"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl shadow-lg">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80"
              alt="Service Banner"
              className="h-56 w-full object-cover sm:h-72"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h2 className="max-w-xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Premium Home Services at Your Doorstep
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigateCustomer('services')}
                  className="rounded-xl bg-[#0d95bd] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#0b84a9]"
                >
                  Explore services in Tirunelveli
                </button>
                <button
                  type="button"
                  onClick={() => navigateCustomer('services')}
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {categoryPills.map((pill) => {
            const Icon = pill.icon;
            const isActive = selectedCategory === pill.id;

            return (
              <button
                type="button"
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`inline-flex min-w-[125px] items-center justify-center gap-2 rounded-full border px-5 py-3 text-base font-medium transition ${
                  isActive
                    ? 'border-[#0d95bd] bg-[#0d95bd] text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {pill.label}
              </button>
            );
          })}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-3xl font-semibold text-slate-900 sm:text-[2rem]">Active Bookings</h3>
            <button type="button" onClick={() => navigateCustomer('bookings')} className="text-base font-semibold text-[#0d95bd]">
              View all
            </button>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#1587ac] to-[#116f91] p-5 text-white shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">In Progress</span>
              <span className="text-sm font-medium text-white/90">Today, 2:30 PM</span>
            </div>

            <h4 className="text-3xl font-semibold sm:text-4xl">Deep House Cleaning</h4>
            <p className="mt-2 text-lg text-white/90">Pro: Marcus White</p>

            <div className="mt-5 border-t border-white/20 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#116f91] shadow"
                >
                  Track Arrival
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-3xl font-semibold text-slate-900 sm:text-[2rem]">Nearby Providers</h3>
            <button
              type="button"
              onClick={() => navigateCustomer('services')}
              className="text-base font-semibold text-[#0d95bd]"
            >
              View All
            </button>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {filteredProviders.map((provider) => (
              <button
                type="button"
                key={provider.name}
                onClick={() => navigateCustomer('services')}
                className="w-[165px] flex-shrink-0 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm"
              >
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="mx-auto mb-4 h-20 w-20 rounded-full border-2 border-[#bde4ef] object-cover"
                />
                <h4 className="text-xl font-semibold text-slate-900">{provider.name}</h4>
                <p className="mt-1 text-[15px] text-slate-500">{provider.role}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-3xl font-semibold text-slate-900 sm:text-[2rem]">Famous Services</h3>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {famousServices.map((service) => (
              <button
                type="button"
                key={service.name}
                onClick={() => navigateCustomer('services')}
                className="relative h-20 w-[116px] flex-shrink-0 overflow-hidden rounded-3xl"
              >
                <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-black/35" />
                <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-semibold tracking-[0.08em] text-white">
                  {service.name.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-3xl font-semibold text-slate-900 sm:text-[2rem]">Nearby Providers</h3>
            <button
              type="button"
              onClick={() => navigateCustomer('services')}
              className="text-base font-semibold text-[#0d95bd]"
            >
              View All
            </button>
          </div>

          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {filteredProviders.map((provider) => (
              <button
                type="button"
                key={`${provider.name}-repeat`}
                onClick={() => navigateCustomer('services')}
                className="w-[165px] flex-shrink-0 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm"
              >
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="mx-auto mb-4 h-20 w-20 rounded-full border-2 border-[#bde4ef] object-cover"
                />
                <h4 className="text-xl font-semibold text-slate-900">{provider.name}</h4>
                <p className="mt-1 text-[15px] text-slate-500">{provider.role}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 py-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => navigateCustomer(tab.id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-medium transition ${
                  isActive ? 'text-[#0d95bd]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
