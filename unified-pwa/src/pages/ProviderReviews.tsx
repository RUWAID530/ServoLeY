import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  customerName: string;
  serviceName: string;
}

const renderStars = (count: number) => {
  const safe = Math.max(0, Math.min(5, Number(count || 0)));
  return Array.from({ length: 5 }).map((_, index) => (index < safe ? '★' : '☆')).join('');
};

export default function ProviderReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [minimumRating, setMinimumRating] = useState(1);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getProviderAuthToken();

      if (!token) {
        setAuthRequired(true);
        setReviews([]);
        return;
      }

      setAuthRequired(false);
      const response = await providerFetchWithFallback('/api/provider/reviews', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(getApiErrorMessage(payload, `Failed to load reviews (${response.status})`));
      }

      const mapped: Review[] = Array.isArray(payload?.data?.reviews)
        ? payload.data.reviews.map((review: any) => ({
            id: String(review.id || ''),
            rating: Number(review.rating || 0),
            reviewText: review.review_text || review.comment || '',
            createdAt: review.created_at || review.createdAt || '',
            customerName: review?.customer?.full_name || 'Customer',
            serviceName: review?.service?.name || 'Service'
          }))
        : [];

      setReviews(mapped);
    } catch (reviewError: any) {
      setError(reviewError?.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(
    () => reviews.filter((review) => review.rating >= minimumRating),
    [reviews, minimumRating]
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-56">
          <div className="h-9 w-9 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center">
          <p className="text-rose-300 mb-4">Please log in to view your reviews.</p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reviews</h1>
          <p className="text-sm text-slate-400">Monitor customer feedback and quality trends.</p>
        </div>
        <Link to="/provider/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Average rating</p>
          <p className="text-3xl text-white font-semibold mt-1">{averageRating.toFixed(1)}</p>
          <p className="text-sm text-amber-300 mt-1">{renderStars(Math.round(averageRating))}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Total reviews</p>
          <p className="text-3xl text-white font-semibold mt-1">{reviews.length}</p>
          <p className="text-sm text-slate-400 mt-1">All time</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Filter by rating</p>
          <select
            value={minimumRating}
            onChange={(event) => setMinimumRating(Number(event.target.value))}
            className="mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value={1}>1 star and above</option>
            <option value={2}>2 stars and above</option>
            <option value={3}>3 stars and above</option>
            <option value={4}>4 stars and above</option>
            <option value={5}>5 stars only</option>
          </select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-white font-medium">No reviews found</p>
          <p className="text-sm text-slate-400 mt-1">
            {reviews.length === 0 ? 'Customer ratings will appear here after completed bookings.' : 'No reviews match the selected rating filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          {filteredReviews.map((review) => (
            <div key={review.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <p className="text-white font-medium">{review.customerName}</p>
                  <p className="text-sm text-slate-400">{review.serviceName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-amber-300 text-sm">{renderStars(review.rating)}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mt-3">{review.reviewText || 'No written comment provided.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
