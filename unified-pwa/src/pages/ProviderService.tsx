import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import { ServiceTable } from '../components/ServiceTable';
import { Summary } from '../components/Summary';
import { API_BASE } from '../App';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  category_id: string;
  duration_minutes: number;
  price: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

interface Settings {
  id: string;
  currency: string;
  tax_rate: number;
  buffer_time_minutes: number;
  booking_window_days: number;
  auto_approve: boolean;
  require_deposit: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProviderServiceApi {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  status: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type ServiceWithCategory = Service & { category_name?: string };

const SERVICE_REFRESH_INTERVAL_MS = 30000;

export function ServicesView() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOns] = useState<AddOn[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending_verification' | 'rejected' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('Any');
  const [selectedPrice, setSelectedPrice] = useState('Any');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const normalizeStatus = (service: ProviderServiceApi) => {
    const status = String(service.status || '').toUpperCase();
    if (status === 'PENDING_VERIFICATION' || status === 'PENDING') return 'pending_verification';
    if (status === 'REJECTED') return 'rejected';
    if (!service.isActive) return 'inactive';
    return 'active';
  };

  const mapService = (service: ProviderServiceApi): ServiceWithCategory => ({
    id: service.id,
    name: service.name,
    category_id: service.category,
    duration_minutes: service.duration || 60,
    price: Number(service.price) || 0,
    status: normalizeStatus(service),
    category_name: service.category,
    created_at: service.createdAt,
    updated_at: service.updatedAt,
  });

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/api/provider/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load provider services: ${response.status}`);
      }

      const payload = await response.json();
      const serviceList: ProviderServiceApi[] = payload?.data?.services || [];
      const normalized = serviceList.map(mapService);

      setServices(normalized);

      const categoryList = Array.from(
        new Set(normalized.map((s) => s.category_name).filter(Boolean))
      );
      setCategories(categoryList.map((name) => ({ id: String(name), name: String(name) })));
      setSettings(null);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
      setCategories([]);
      setSettings(null);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    const intervalId = window.setInterval(loadData, SERVICE_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket'],
    });

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    socket.emit('services:subscribe');

    if (token) {
      socket.emit('provider:subscribe', { token });
    }

    socket.on('services:updated', () => {
      loadData();
    });

    return () => {
      socket.off('services:updated');
      socket.disconnect();
    };
  }, [loadData]);

  const filteredServices = services.filter((service) => {
    if (activeTab !== 'all' && service.status !== activeTab) return false;
    if (searchQuery && !service.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== 'All' && service.category_name !== selectedCategory) return false;
    return true;
  });

  const activeServices = services.filter((s) => s.status === 'active');
  const avgPrice = activeServices.length > 0
    ? activeServices.reduce((sum, s) => sum + Number(s.price), 0) / activeServices.length
    : 0;
  const avgDuration = activeServices.length > 0
    ? activeServices.reduce((sum, s) => sum + s.duration_minutes, 0) / activeServices.length
    : 0;

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (id: string) => {
    console.log('Edit service:', id);
  };

  const handleDeactivate = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/services/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.message || 'Failed to deactivate service');
      }

      await loadData();
    } catch (error) {
      console.error('Error deactivating service:', error);
    }
  };

  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row">
      <main className="flex-1 p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Services</h1>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              onClick={() => navigate('/provider/new-listing')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium text-white transition-colors text-center"
            >
              New Category
            </button>
            <button
              onClick={() => navigate('/provider/new-listing')}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Service
            </button>
          </div>
        </div>

        <div className="mb-6 -mx-1 overflow-x-auto px-1">
          <div className="flex min-w-max gap-2">
            {(['all', 'active', 'pending_verification', 'rejected', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {tab === 'pending_verification' ? 'Pending' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Service catalog</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:col-span-2 xl:col-span-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="All">Category: All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  Category: {cat.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option>Duration: Any</option>
            </select>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option>Price: Any</option>
            </select>
          </div>

          <ServiceTable
            services={paginatedServices}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button className="px-4 py-2 bg-cyan-600 rounded-lg font-medium">
                {currentPage}
              </button>
              <button
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                {Math.min(currentPage + 1, totalPages)}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <p className="text-sm text-white opacity-80 sm:text-right">
              Showing {filteredServices.length === 0 ? 0 : Math.min(filteredServices.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
              {Math.min(filteredServices.length, currentPage * itemsPerPage)} of {filteredServices.length} services
            </p>
          </div>
        </div>
      </main>

      <aside className="w-full xl:w-80 bg-slate-900 p-4 sm:p-6 border-t border-slate-700 xl:border-t-0 xl:border-l">
        <Summary
          activeCount={activeServices.length}
          avgPrice={avgPrice}
          avgDuration={avgDuration}
          addOns={addOns}
          settings={settings}
          onManage={() => console.log('Manage')}
          onUpdateSettings={handleUpdateSettings}
        />
      </aside>
    </div>
  );
}
