
import { ArrowLeft, Clock, MapPin, Shield, ImagePlus, X } from 'lucide-react';
import { Provider } from '../types/Index';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8086';
const FIXED_CITY = 'Tirunelveli';

const formatServiceDateTime = (dateValue: string, timeValue: string) => {
  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
  const baseDate = isIsoDate ? dateValue : new Date().toISOString().split('T')[0];

  const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hours = 10;
  let minutes = 0;

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10) % 12;
    minutes = parseInt(timeMatch[2], 10);
    if (timeMatch[3].toUpperCase() === 'PM') hours += 12;
  }

  const date = new Date(`${baseDate}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const resolveServiceId = (service: any) => {
  const candidate =
    service?.id ??
    service?.serviceId ??
    service?.service_id ??
    service?.serviceID ??
    '';

  return String(candidate).trim();
};

const isNetworkFetchError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.name === 'TypeError' ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed')
  );
};

const resolveImageUrl = (value?: string | null) => {
  if (!value) return '/placeholder-avatar.png';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${API_BASE}${value}`;
  }
  return `${API_BASE}/${value}`;
};

interface BookFlowProps {
  provider?: Provider;
  onBack: () => void;
  onComplete: () => void;
}

export default function CustomerBookingsDashboard({ provider, onBack, onComplete }: BookFlowProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedServiceRaw = location.state?.service;
  const preselectedService = typeof preselectedServiceRaw === 'string'
    ? { id: 'default', name: preselectedServiceRaw, description: '', price: 0 }
    : preselectedServiceRaw;
  const preselectedDate = location.state?.date;
  const preselectedTime = location.state?.time;
  const preselectedProblem = location.state?.problem;
  const [providerData, setProviderData] = useState<Provider | undefined>(provider);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [address, setAddress] = useState('Palayamkottai');
  const [city] = useState(FIXED_CITY);
  const [zip, setZip] = useState('627001');
  
  useEffect(() => {
    // If provider is not passed directly, check if it's in the location state
    if (!provider && location.state?.provider) {
      setProviderData(location.state.provider);
    }
  }, [provider, location.state]);
  
  // Update selectedService when providerData changes
  useEffect(() => {
    if (providerData?.services?.[0]) {
      setSelectedService(providerData.services[0]);
    }
  }, [providerData]);
  
  const [selectedService, setSelectedService] = useState(
    preselectedService ||
    providerData?.services?.[0] || 
    location.state?.provider?.services?.[0] || 
    { id: 'default', name: 'Standard Service', description: 'Default service', price: 50 }
  );
  const [selectedDate, setSelectedDate] = useState(preselectedDate || new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(preselectedTime || '12:30 PM');
  const [issueDescription, setIssueDescription] = useState(preselectedProblem || '');
  const [issuePhotos, setIssuePhotos] = useState<File[]>([]);
  const [issuePhotoPreviewUrls, setIssuePhotoPreviewUrls] = useState<string[]>([]);

  const timeSlots = ['10:00 AM', '12:30 PM', '03:00 PM', '05:30 PM'];

  const providerFromService =
    selectedService?.providers ||
    selectedService?.provider ||
    preselectedService?.providers ||
    preselectedService?.provider ||
    null;
  const providerNameFromService = [
    providerFromService?.users?.profiles?.firstName,
    providerFromService?.users?.profiles?.lastName
  ].filter(Boolean).join(' ').trim();
  const providerName =
    providerData?.name ||
    providerNameFromService ||
    providerFromService?.businessName ||
    selectedService?.providerName ||
    'Service Provider';
  const providerCategory =
    providerData?.category ||
    selectedService?.category ||
    providerFromService?.category ||
    'General';
  const providerRatingValue = Number(
    providerData?.rating ||
    providerFromService?.rating ||
    selectedService?.rating ||
    0
  );
  const providerRatingText = providerRatingValue > 0 ? providerRatingValue.toFixed(1) : 'New';
  const providerJobs = Number(
    providerData?.jobsCompleted ||
    providerFromService?.totalOrders ||
    selectedService?.completedJobs ||
    0
  );
  const providerLocation = FIXED_CITY;
  const providerOnline = providerData?.isOnline ?? providerFromService?.isOnline ?? false;
  const providerAvatar = resolveImageUrl(
    providerData?.avatar ||
    providerFromService?.users?.profiles?.avatar ||
    selectedService?.providerImage ||
    null
  );

  useEffect(() => {
    const previewUrls = issuePhotos.map((file) => URL.createObjectURL(file));
    setIssuePhotoPreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [issuePhotos]);

  const basePrice = Number(selectedService?.price || 0);
  const total = basePrice;

  const handleConfirmBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again.');
        navigate('/auth');
        return;
      }

      const resolvedServiceId = resolveServiceId(selectedService) || resolveServiceId(preselectedService);
      if (!resolvedServiceId || resolvedServiceId === 'default') {
        alert('Please choose a valid service to continue.');
        return;
      }

      if (!address.trim()) {
        alert('Please enter service address.');
        return;
      }

      if (!issueDescription.trim()) {
        alert('Please describe your issue before confirming.');
        return;
      }

      setBookingInProgress(true);
      const serviceDate = formatServiceDateTime(selectedDate, selectedTime);
      const bookingPayload = {
        serviceId: resolvedServiceId,
        serviceDate,
        address: `${address.trim()}, ${city.trim()} ${zip.trim()}`.trim(),
        notes: issueDescription.trim()
      };

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Use JSON when there are no photos to avoid multipart parsing edge cases.
      if (issuePhotos.length === 0) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/json'
        };
        requestOptions.body = JSON.stringify(bookingPayload);
      } else {
        const formData = new FormData();
        formData.append('serviceId', bookingPayload.serviceId);
        formData.append('serviceDate', bookingPayload.serviceDate);
        formData.append('address', bookingPayload.address);
        formData.append('notes', bookingPayload.notes);
        issuePhotos.forEach((file) => {
          formData.append('issuePhotos', file);
        });
        requestOptions.body = formData;
      }

      const orderEndpoints = Array.from(
        new Set([
          `${API_BASE}/api/orders`,
          '/api/orders'
        ])
      );

      let response: Response | null = null;
      let lastFetchError: any = null;

      for (const endpoint of orderEndpoints) {
        try {
          response = await fetch(endpoint, requestOptions);
          break;
        } catch (fetchError: any) {
          lastFetchError = fetchError;
          if (!isNetworkFetchError(fetchError)) {
            throw fetchError;
          }
        }
      }

      if (!response) {
        throw lastFetchError || new Error('Failed to connect to booking service');
      }

      const payloadText = await response.text();
      let payload: any = {};
      try {
        payload = payloadText ? JSON.parse(payloadText) : {};
      } catch {
        payload = {};
      }

      if (!response.ok || !payload?.success) {
        const validationMessages = Array.isArray(payload?.errors)
          ? payload.errors
              .map((err: any) => err?.msg || err?.message)
              .filter(Boolean)
          : [];
        const backendErrorDetails = [
          payload?.error?.code ? `code: ${payload.error.code}` : '',
          payload?.error?.details || '',
          payload?.error?.meta ? JSON.stringify(payload.error.meta) : ''
        ].filter(Boolean).join(' | ');
        const detailedMessage = validationMessages.length > 0
          ? validationMessages.join(', ')
          : ([payload?.message || 'Failed to create booking', backendErrorDetails].filter(Boolean).join(' - '));
        throw new Error(detailedMessage);
      }

      alert('Booking confirmed successfully!');

      // Stay on booking page after successful submission
      setIssueDescription('');
      setIssuePhotos([]);
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert(error?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <Navigation active="services" onNavigate={() => {}} />
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Book {providerName}</h1>
          <div className="ml-auto px-3 py-1.5 bg-gray-800 rounded-full text-sm">
            {FIXED_CITY}
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-gray-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              <img src={providerAvatar} alt={providerName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg mb-1">{providerName}</h2>
              <p className="text-sm text-gray-400">
                {providerCategory} • {providerRatingText} • {providerJobs.toLocaleString()} jobs
              </p>
            </div>
            <div className="text-right">
              <div className="px-3 py-1.5 bg-gray-700 rounded-lg text-xs font-semibold">
                <span className="text-violet-400">ETA</span>
                <div className="text-white">30-45m</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 rounded-lg text-xs">
              <Shield size={12} className="text-violet-400" />
              <span className="text-violet-300">Verified</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-lg text-xs text-gray-300">
              <span>{providerOnline ? 'Online now' : 'Currently offline'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-lg text-xs text-gray-300">
              <MapPin size={12} />
              <span>{providerLocation}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Choose Service</h3>
          <div className="space-y-3">
            {(providerData?.services || [selectedService]).map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`w-full rounded-xl p-4 text-left transition-all ${
                  selectedService.id === service.id
                    ? 'bg-violet-600/20 border-2 border-violet-500'
                    : 'bg-gray-800/60 border-2 border-transparent hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{service.name}</h4>
                    <p className="text-sm text-gray-400">{service.description}</p>
                  </div>
                  <p className="text-xl font-bold ml-4">${Number(service.price || 0)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Basic Details</h3>
          <div className="bg-gray-800/60 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Time</label>
                <button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                  <Clock size={18} className="text-violet-400" />
                  <span className="font-semibold">{selectedTime}</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-2.5 rounded-lg font-semibold transition-colors ${
                    selectedTime === time
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Location</h3>
          <div className="bg-gray-800/60 rounded-xl p-4">
            <label className="text-sm text-gray-400 block mb-2">Service Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 block mb-2">City</label>
                <input
                  type="text"
                  value={city}
                  readOnly
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Zip</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Describe Your Issue</h3>
          <div className="bg-gray-800/60 rounded-xl p-4">
            <label className="text-sm text-gray-400 block mb-2">Issue Description</label>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Explain your problem, requirements, or any important details for the provider..."
              rows={5}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              Include symptoms, preferred materials, and anything the provider should know before arrival.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Attach Issue Photos</h3>
          <div className="bg-gray-800/60 rounded-xl p-4">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 cursor-pointer transition-colors text-sm font-medium">
              <ImagePlus size={16} />
              Add Photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  setIssuePhotos((prev) => [...prev, ...files].slice(0, 6));
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Upload up to 6 photos to help the provider understand the issue better.
            </p>

            {issuePhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {issuePhotos.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative">
                    <img
                      src={issuePhotoPreviewUrls[index]}
                      alt={`Issue ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIssuePhotos((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          <div className="bg-gray-800/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <span className="text-gray-400">Selected service</span>
              <span className="font-semibold">{selectedService.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Base price</span>
                <span className="font-semibold">${basePrice}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-violet-400">${total}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={bookingInProgress}
            className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold transition-colors disabled:opacity-60"
          >
            {bookingInProgress ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

