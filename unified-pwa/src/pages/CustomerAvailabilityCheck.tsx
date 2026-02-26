import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Clock, MapPin, Star, Store, User } from 'lucide-react';
import { getServices } from '../services/api_new';

const FIXED_CITY = 'Tirunelveli';
const DEFAULT_CATEGORY_OPTIONS = [
  'Mobile',
  'Bike',
  'Car',
  'AC / WM',
  'Electrical',
  'Plumbing',
  'Cleaning'
];
const TIME_OPTIONS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM'
];

const getProviderRecord = (service: any) => service?.providers || service?.provider || null;
const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeCategoryKey = (value: string) => {
  const normalized = normalizeText(value || '');
  if (!normalized) return '';
  if (normalized === 'ac' || normalized === 'wm' || normalized === 'acwm' || normalized.includes('washingmachine')) {
    return 'acwm';
  }
  return normalized;
};

const normalizeProviderType = (value: string) => {
  const type = (value || '').toLowerCase();
  return type === 'store' || type === 'shop' ? 'store' : 'freelancer';
};

const getProviderName = (service: any) => {
  const provider = getProviderRecord(service);
  const firstName = provider?.users?.profiles?.firstName;
  const lastName = provider?.users?.profiles?.lastName;
  return [firstName, lastName].filter(Boolean).join(' ').trim() || provider?.businessName || 'Provider';
};

const getCategoryFromQuery = (queryCategory: string, availableCategories: string[]) => {
  if (!queryCategory) return '';
  const key = normalizeCategoryKey(queryCategory);
  return availableCategories.find((category) => normalizeCategoryKey(category) === key) || '';
};

const resolveProviderDistance = (provider: any) => {
  const value = Number(provider?.distanceKm ?? provider?.distance ?? 0);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return 0;
};

type ProviderTypeFilter = 'all' | 'freelancer' | 'store';

interface MatchRecord {
  providerId: string;
  providerName: string;
  providerAvatar: string | null;
  providerType: 'freelancer' | 'store';
  providerRating: number;
  providerJobs: number;
  providerOnline: boolean;
  distanceKm: number;
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  category: string;
  price: number;
  rawService: any;
}

const CustomerAvailabilityCheck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ providerId?: string; serviceName?: string }>();

  const preselectedService = (location.state as any)?.service;
  const preselectedProviderType = normalizeProviderType(
    getProviderRecord(preselectedService)?.providerType || ''
  );
  const queryCategory = new URLSearchParams(location.search).get('category') || '';
  const fixedProviderId = params.providerId || '';
  const fixedServiceName = params.serviceName ? decodeURIComponent(params.serviceName) : '';

  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedProviderType, setSelectedProviderType] = useState<ProviderTypeFilter>(
    preselectedService ? preselectedProviderType : 'all'
  );
  const [radiusKm, setRadiusKm] = useState(10);
  const [matchingProviders, setMatchingProviders] = useState<MatchRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        setLoadingServices(true);
        setError('');
        const data = await getServices();
        if (!active) return;
        setServices(Array.isArray(data) ? data : []);
      } catch (loadError: any) {
        if (!active) return;
        setServices([]);
        setError(loadError?.message || 'Failed to load services');
      } finally {
        if (active) {
          setLoadingServices(false);
        }
      }
    };

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  const serviceRecords = useMemo(() => {
    return services
      .map((service: any) => {
        const provider = getProviderRecord(service);
        if (!provider?.id) return null;

        return {
          providerId: provider.id,
          providerName: getProviderName(service),
          providerAvatar: provider?.users?.profiles?.avatar || null,
          providerType: normalizeProviderType(provider?.providerType || ''),
          providerRating: Number(provider?.rating || service?.rating || 0),
          providerJobs: Number(provider?.totalOrders || 0),
          providerOnline: Boolean(provider?.isOnline),
          distanceKm: resolveProviderDistance(provider),
          serviceId: String(service?.id || ''),
          serviceName: service?.name || service?.title || 'Service',
          serviceDescription: service?.description || '',
          category: service?.category || provider?.category || 'General',
          price: Number(service?.price || 0),
          rawService: service
        };
      })
      .filter(Boolean) as MatchRecord[];
  }, [services]);

  const availableCategories = useMemo(() => {
    const merged = new Map<string, string>();

    [...DEFAULT_CATEGORY_OPTIONS, ...serviceRecords.map((record) => record.category)]
      .map((category) => String(category || '').trim())
      .filter(Boolean)
      .forEach((category) => {
        const key = normalizeCategoryKey(category);
        if (!merged.has(key)) {
          merged.set(key, category);
        }
      });

    return Array.from(merged.values());
  }, [serviceRecords]);

  useEffect(() => {
    if (selectedCategory || availableCategories.length === 0) return;

    const initialCandidates = [
      queryCategory,
      preselectedService?.category || ''
    ].filter(Boolean);

    for (const candidate of initialCandidates) {
      const resolved = getCategoryFromQuery(candidate, availableCategories);
      if (resolved) {
        setSelectedCategory(resolved);
        return;
      }
    }

    setSelectedCategory(availableCategories[0] || '');
  }, [availableCategories, selectedCategory, queryCategory, preselectedService]);

  const findMatchingProviders = () => {
    if (!selectedCategory || !selectedDate || !selectedTime) {
      setError('Please select category, date, and time.');
      return;
    }

    setIsSearching(true);
    setError('');

    const filtered = serviceRecords.filter((record) => {
      const categoryMatch =
        normalizeCategoryKey(record.category) === normalizeCategoryKey(selectedCategory);
      const providerTypeMatch =
        selectedProviderType === 'all' || record.providerType === selectedProviderType;
      const radiusMatch = record.distanceKm <= 0 || record.distanceKm <= radiusKm;
      const providerMatch = !fixedProviderId || record.providerId === fixedProviderId;
      const serviceNameMatch =
        !fixedServiceName ||
        normalizeText(record.serviceName).includes(normalizeText(fixedServiceName));

      return categoryMatch && providerTypeMatch && radiusMatch && providerMatch && serviceNameMatch;
    });

    const groupedByProvider = new Map<string, MatchRecord>();
    filtered.forEach((record) => {
      const existing = groupedByProvider.get(record.providerId);
      if (!existing || record.price < existing.price) {
        groupedByProvider.set(record.providerId, record);
      }
    });

    const matches = Array.from(groupedByProvider.values()).sort((a, b) => {
      if (b.providerRating !== a.providerRating) {
        return b.providerRating - a.providerRating;
      }
      if (b.providerJobs !== a.providerJobs) {
        return b.providerJobs - a.providerJobs;
      }
      return a.price - b.price;
    });

    setMatchingProviders(matches);
    setHasSearched(true);
    setIsSearching(false);
  };

  const handleBookNow = (record: MatchRecord) => {
    navigate('/customer/bookings', {
      state: {
        service: record.rawService,
        provider: {
          id: record.providerId,
          name: record.providerName,
          avatar: record.providerAvatar,
          rating: record.providerRating,
          jobsCompleted: record.providerJobs,
          isOnline: record.providerOnline,
          category: record.category,
          location: FIXED_CITY,
          services: [record.rawService]
        },
        date: selectedDate,
        time: selectedTime
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold">Check Availability</h1>
            <p className="text-slate-400 text-sm">{FIXED_CITY}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Select Availability Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm text-slate-300 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                disabled={loadingServices}
              >
                <option value="">Select category</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Preferred Date</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Preferred Time</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select time</option>
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Provider Type</label>
              <select
                value={selectedProviderType}
                onChange={(e) => setSelectedProviderType(e.target.value as ProviderTypeFilter)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">Store + Freelancer</option>
                <option value="store">Store</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-300">Radius</label>
              <span className="text-sm font-medium text-violet-300">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>

          <div className="mt-5">
            <button
              onClick={findMatchingProviders}
              disabled={loadingServices || isSearching}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            >
              {isSearching ? 'Checking...' : 'Find Matching Providers'}
            </button>
          </div>
        </section>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-red-700/50 bg-red-900/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Matching Providers</h2>
            {hasSearched && (
              <span className="text-sm text-slate-400">
                {matchingProviders.length} {matchingProviders.length === 1 ? 'provider' : 'providers'} found
              </span>
            )}
          </div>

          {loadingServices ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
              Loading providers...
            </div>
          ) : hasSearched && matchingProviders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
              No providers matched your selected category, provider type, and radius.
            </div>
          ) : hasSearched ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {matchingProviders.map((record) => (
                <article
                  key={`${record.providerId}-${record.serviceId}`}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {record.providerAvatar ? (
                      <img
                        src={record.providerAvatar}
                        alt={record.providerName}
                        className="w-14 h-14 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{record.providerName}</p>
                      <p className="text-xs text-slate-400">{FIXED_CITY}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 inline-flex items-center gap-1">
                      {record.providerType === 'store' ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {record.providerType === 'store' ? 'Store' : 'Freelancer'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {record.providerRating > 0 ? record.providerRating.toFixed(1) : 'New'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {record.providerJobs} jobs
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedTime}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {record.distanceKm > 0 ? `${record.distanceKm.toFixed(1)} km` : `Within ${radiusKm} km`}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-800/70 p-3 mb-4">
                    <p className="font-medium text-white">{record.serviceName}</p>
                    <p className="text-sm text-slate-400 line-clamp-2">{record.serviceDescription || 'No description provided.'}</p>
                    <p className="text-violet-300 font-semibold mt-2">Rs {record.price.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/customer/provider-details', { state: { service: record.rawService } })}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleBookNow(record)}
                      className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-sm font-medium"
                    >
                      Book Now
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
              Select filters and click <span className="text-slate-200 font-medium">Find Matching Providers</span>.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CustomerAvailabilityCheck;
