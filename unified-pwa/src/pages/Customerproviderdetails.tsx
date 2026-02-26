import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, User, Briefcase, Calendar } from 'lucide-react';

const getProviderRecord = (service: any) => service?.providers || service?.provider || null;

const formatPrice = (price: any) => {
  const value = Number(price);
  return Number.isFinite(value) ? `Rs ${value.toLocaleString('en-IN')}` : 'Price on request';
};

const CustomerProviderDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const service = (location.state as any)?.service;

  const details = useMemo(() => {
    const provider = getProviderRecord(service);
    const firstName = provider?.users?.profiles?.firstName;
    const lastName = provider?.users?.profiles?.lastName;
    const providerName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      provider?.businessName ||
      'Provider';

    return {
      providerId: provider?.id || service?.providerId || 'provider',
      providerName,
      providerAvatar: provider?.users?.profiles?.avatar || null,
      category: service?.category || provider?.category || 'General',
      rating: Number(provider?.rating || service?.rating || 0),
      totalJobs: Number(provider?.totalOrders || 0),
      location: 'Tirunelveli',
      isOnline: !!provider?.isOnline,
      serviceName: service?.name || service?.title || 'Service',
      serviceDescription: service?.description || 'No description provided yet.',
      servicePrice: formatPrice(service?.price)
    };
  }, [service]);

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-xl font-semibold mb-2">No provider selected</p>
          <p className="text-slate-400 mb-6">Please open provider details from the Services page.</p>
          <button
            onClick={() => navigate('/customer/services')}
            className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 transition-colors"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const ratingText = details.rating > 0 ? details.rating.toFixed(1) : 'New';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <p className="text-slate-300 text-sm">Provider Details</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 p-6">
          <div className="flex items-start gap-4">
            {details.providerAvatar ? (
              <img src={details.providerAvatar} alt={details.providerName} className="w-16 h-16 rounded-full object-cover border-2 border-white" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{details.providerName}</h1>
              <p className="text-white/80 text-sm mt-1">{details.category}</p>

              <div className="flex flex-wrap gap-3 mt-3 text-sm">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20">
                  <Star className="w-4 h-4 fill-white" />
                  {ratingText}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20">
                  <Briefcase className="w-4 h-4" />
                  {details.totalJobs} jobs
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20">
                  <MapPin className="w-4 h-4" />
                  {details.location}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20">
                  <Clock className="w-4 h-4" />
                  {details.isOnline ? 'Online now' : 'Currently offline'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-3">{details.serviceName}</h2>
          <p className="text-slate-300 mb-5">{details.serviceDescription}</p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-sm">{details.servicePrice}</span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-sm">{details.category}</span>
          </div>

          <button
            onClick={() => navigate('/customer/bookings', { state: { service } })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 font-semibold transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book Now
          </button>
        </section>
      </main>
    </div>
  );
};

export default CustomerProviderDetails;
