import { SlidersHorizontal, Search, MapPin, Star, Clock, Store, User } from 'lucide-react';
import Navigation from '../components/Navigation';
import CustomerHeader from '../components/CustomerHeader';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api_new';
import { useUserImage } from '../hooks/useUserImage';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8086';
const SERVICE_REFRESH_INTERVAL_MS = 30000;

const getProviderRecord = (service: any) => service?.providers || service?.provider || null;

const getProviderName = (service: any) => {
  const provider = getProviderRecord(service);
  const firstName = provider?.users?.profiles?.firstName;
  const lastName = provider?.users?.profiles?.lastName;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || provider?.businessName || service?.providerName || service?.provider || 'Provider';
};

const getProviderLocation = (_service: any) => 'Tirunelveli';

const getProviderType = (service: any) => {
  const provider = getProviderRecord(service);
  const providerType = (provider?.providerType || '').toString().toLowerCase();
  return providerType === 'store' ? 'shop' : 'freelancer';
};

const getProviderTypeBadge = (type: string) => {
  if (type === 'shop') {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-900',
      icon: <Store className="w-3 h-3" />,
      label: 'Store'
    };
  }

  return {
    bg: 'bg-green-100',
    text: 'text-green-900',
    icon: <User className="w-3 h-3" />,
    label: 'Freelancer'
  };
};

export default function CustomerServicesDashboard() {
  const [active, setActive] = useState<'home' | 'services' | 'wallet' | 'support' | 'profile'>('services');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const userImage = useUserImage();
  const navigate = useNavigate();

  const fetchServices = useCallback(async () => {
    try {
      const servicesData = await getServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (!document.hidden) fetchServices();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    const intervalId = window.setInterval(fetchServices, SERVICE_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
      window.clearInterval(intervalId);
    };
  }, [fetchServices]);

  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket'] });
    socket.emit('services:subscribe');
    socket.on('services:updated', fetchServices);

    return () => {
      socket.off('services:updated', fetchServices);
      socket.disconnect();
    };
  }, [fetchServices]);

  const handleNavigate = (page: typeof active) => {
    setActive(page);

    switch (page) {
      case 'home':
        navigate('/customer/home');
        break;
      case 'services':
        navigate('/customer/services');
        break;
      case 'wallet':
        navigate('/customer/wallet');
        break;
      case 'support':
        navigate('/customer/support/dashboard');
        break;
      case 'profile':
        navigate('/customer/profile');
        break;
    }
  };

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return services;

    return services.filter((service: any) => {
      const serviceName = (service?.name || service?.title || '').toLowerCase();
      const providerName = getProviderName(service).toLowerCase();
      const category = (service?.category || '').toLowerCase();
      const description = (service?.description || '').toLowerCase();

      return (
        serviceName.includes(query) ||
        providerName.includes(query) ||
        category.includes(query) ||
        description.includes(query)
      );
    });
  }, [services, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950">
      <CustomerHeader userImage={userImage} />
      <Navigation active={active} onNavigate={handleNavigate} onCustomerService={() => {}} />

      <div className="pb-24">
        <div className="bg-gradient-to-br from-pink-600 via-pink-500 to-violet-600 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-pink-100 mb-2">/ Services</p>
                <h1 className="text-4xl font-bold text-white">Service Listings</h1>
              </div>
              <button className="bg-pink-100 hover:bg-white text-slate-900 px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for services, providers, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-white text-2xl font-bold">
              {searchQuery ? `Search results for "${searchQuery}"` : 'Top providers near you'}
            </h2>
            <span className="text-white opacity-70">
              {filteredServices.length} {filteredServices.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="lg:col-span-3 text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
                <p className="mt-4 text-white">Loading services...</p>
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service: any) => {
                const provider = getProviderRecord(service);
                const providerType = getProviderType(service);
                const providerBadge = getProviderTypeBadge(providerType);
                const providerName = getProviderName(service);
                const providerLocation = getProviderLocation(service);
                const providerRating = Number(provider?.rating || service?.rating || 0);
                const ratingText = providerRating > 0 ? providerRating.toFixed(1) : 'New';
                const providerReviewCount = provider?._count?.reviews;
                const completedJobs = Number(provider?.totalOrders || service?.completedJobs || 0);
                const providerId = provider?.id || service?.providerId || 'provider';
                const providerAvatar = provider?.users?.profiles?.avatar || service?.providerImage;
                const servicePrice = Number(service?.price);

                return (
                  <div
                    key={service?.id || `${providerId}-${service?.name || service?.title || 'service'}`}
                    className="bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 hover:border-pink-500 transition-all group"
                  >
                    <div className="relative">
                      {service?.image ? (
                        <img
                          src={service.image}
                          alt={service?.name || service?.title || 'Service'}
                          className="w-full h-52 object-cover"
                        />
                      ) : (
                        <div className="w-full h-52 bg-gradient-to-br from-slate-700 to-slate-900" />
                      )}

                      <div className={`absolute top-3 left-3 ${providerBadge.bg} ${providerBadge.text} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                        {providerBadge.icon}
                        {providerBadge.label}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        {providerAvatar ? (
                          <img
                            src={providerAvatar}
                            alt={providerName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-pink-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-pink-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-300" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg mb-1">{service?.name || service?.title || 'Service'}</h3>
                          <p className="text-white text-sm opacity-80 mb-2">
                            {providerName} • {providerLocation}
                          </p>

                          <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                <User className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm">{providerName}</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-white text-sm">{ratingText}</span>
                                  <span className="text-gray-400 text-sm">
                                    ({typeof providerReviewCount === 'number' ? `${providerReviewCount} reviews` : `${completedJobs} jobs`})
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-300">{providerLocation}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-300">{provider?.isOnline ? 'Online now' : 'Currently offline'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">Category:</span>
                                <span className="text-gray-300">{provider?.category || service?.category || 'General'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-400">Completed:</span>
                                <span className="text-gray-300">{completedJobs}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-slate-800 text-white text-sm px-3 py-1 rounded-full">
                          {Number.isFinite(servicePrice) ? `Rs ${servicePrice.toLocaleString('en-IN')}` : 'Price on request'}
                        </span>
                        <span className="bg-slate-800 text-white text-sm px-3 py-1 rounded-full">
                          {service?.category || 'Service'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigate('/customer/bookings', { state: { service } })}
                          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-full font-semibold transition-colors mr-2"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={() => navigate('/customer/provider-details', { state: { service } })}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="lg:col-span-3 text-center py-12">
                <p className="text-white text-lg">
                  {searchQuery ? `No services found for "${searchQuery}"` : 'No services available at the moment.'}
                </p>
                <p className="text-white opacity-70 text-sm mt-2">
                  {searchQuery ? 'Try different keywords or browse all services.' : 'Check back later for new service listings.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

