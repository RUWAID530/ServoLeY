import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  Headset,
  Home,
  Plus,
  Search,
  User,
  Wallet,
  Wrench
} from 'lucide-react';
import { getServices } from '../services/api_new';
import { resolveMediaUrl } from '../utils/media';

interface ServiceCard {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  image: string;
  raw: any;
}

const fallbackCards: ServiceCard[] = [
  {
    id: 'fallback-1',
    name: 'Deep Kitchen Cleaning',
    category: 'Cleaning',
    description: 'Specialized kitchen hygiene and surface care.',
    duration: '2 hrs',
    price: 49,
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
    raw: {}
  },
  {
    id: 'fallback-2',
    name: 'Bathroom Disinfection',
    category: 'Cleaning',
    description: 'Deep sanitization for all bathroom surfaces.',
    duration: '1.5 hrs',
    price: 35,
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80',
    raw: {}
  },
  {
    id: 'fallback-3',
    name: 'Full House Deep Cleaning',
    category: 'Cleaning',
    description: 'Complete home deep cleaning package.',
    duration: '5-6 hrs',
    price: 149,
    image: 'https://images.unsplash.com/photo-1616594039964-3f4d6e9f003d?auto=format&fit=crop&w=900&q=80',
    raw: {}
  }
];

const normalizeText = (value: string) => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const deriveDuration = (service: any, index: number) => {
  const raw = service?.duration || service?.estimatedDuration || service?.timeRequired || service?.time;

  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return `${raw} hrs`;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }

  const name = `${service?.name || service?.title || ''}`.toLowerCase();
  if (name.includes('bath')) return '1.5 hrs';
  if (name.includes('kitchen')) return '2 hrs';
  if (name.includes('full') || name.includes('house')) return '5-6 hrs';

  const durations = ['2 hrs', '1.5 hrs', '5-6 hrs', '3 hrs'];
  return durations[index % durations.length];
};

const derivePrice = (service: any, index: number) => {
  const rawPrice = Number(service?.price || service?.amount || 0);
  if (Number.isFinite(rawPrice) && rawPrice > 0) {
    if (rawPrice > 1000) return Math.round(rawPrice / 80);
    return Math.round(rawPrice);
  }

  const prices = [49, 35, 149, 79, 95, 120];
  return prices[index % prices.length];
};

export default function CustomerServicesDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);

  const queryCategory = new URLSearchParams(location.search).get('category') || 'Cleaning';

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getServices();
      setServices(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const cards = useMemo(() => {
    const mapped = services.map((service: any, index: number): ServiceCard => {
      const image = resolveMediaUrl(service?.image, '') || fallbackCards[index % fallbackCards.length].image;

      return {
        id: String(service?.id || `service-${index}`),
        name: service?.name || service?.title || fallbackCards[index % fallbackCards.length].name,
        category: service?.category || fallbackCards[index % fallbackCards.length].category,
        description:
          service?.description || fallbackCards[index % fallbackCards.length].description,
        duration: deriveDuration(service, index),
        price: derivePrice(service, index),
        image,
        raw: service
      };
    });

    const targetCategory = normalizeText(queryCategory);
    const categoryMatches = mapped.filter(
      (card) => normalizeText(card.category).includes(targetCategory) || normalizeText(card.name).includes(targetCategory)
    );

    if (categoryMatches.length > 0) return categoryMatches;
    if (mapped.length > 0) return mapped;
    return fallbackCards;
  }, [services, queryCategory]);

  const headingCategory = queryCategory.toLowerCase().includes('clean') ? 'Deep Cleaning' : queryCategory;

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-24 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-7 w-7" />
            </button>
            <h1 className="text-2xl font-bold sm:text-[2rem]">Select Service</h1>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
            aria-label="Search"
          >
            <Search className="h-7 w-7" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <section>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-[2.3rem]">{headingCategory} Services</h2>
          <p className="mt-2 text-lg text-slate-500 sm:text-2xl">
            Specialized cleaning for every corner of your home.
          </p>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? [1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-48 w-full rounded-t-3xl bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-6 w-3/4 rounded bg-slate-200" />
                    <div className="h-4 w-1/2 rounded bg-slate-200" />
                    <div className="h-10 w-full rounded bg-slate-200" />
                  </div>
                </div>
              ))
            : cards.map((card, index) => (
                <article
                  key={card.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative">
                    <img src={card.image} alt={card.name} className="h-48 w-full object-cover" />
                    {index === 0 && (
                      <span className="absolute left-4 top-4 rounded-xl bg-white px-3 py-1 text-sm font-semibold tracking-wide text-[#2563eb]">
                        BEST SELLER
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="min-h-[4.5rem] text-[2rem] font-semibold leading-tight text-slate-900 sm:text-[1.95rem]">
                      {card.name}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-slate-400">
                      <Clock3 className="h-4 w-4" />
                      <span className="text-lg sm:text-xl">{card.duration}</span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <p className="text-[2.2rem] font-bold text-[#2563eb] sm:text-[2rem]">${card.price}</p>
                      <button
                        type="button"
                        onClick={() => navigate('/customer/bookings', { state: { service: card.raw } })}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-lg hover:bg-[#1d4ed8]"
                        aria-label={`Add ${card.name}`}
                      >
                        <Plus className="h-7 w-7" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 px-2 py-2">
          <button
            type="button"
            onClick={() => navigate('/customer/home')}
            className="flex flex-col items-center gap-1 py-2 text-slate-400"
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.12em]">HOME</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/customer/services')}
            className="flex flex-col items-center gap-1 py-2 text-[#2563eb]"
          >
            <Wrench className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.12em]">SERVICES</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/customer/wallet')}
            className="flex flex-col items-center gap-1 py-2 text-slate-400"
          >
            <Wallet className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.12em]">WALLET</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/customer/support/dashboard')}
            className="flex flex-col items-center gap-1 py-2 text-slate-400"
          >
            <Headset className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.12em]">SUPPORT</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/customer/profile')}
            className="flex flex-col items-center gap-1 py-2 text-slate-400"
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-semibold tracking-[0.12em]">PROFILE</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
