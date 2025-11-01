import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface Review {
  id: string
  orderId: string
  customerName: string
  customerAvatar?: string
  serviceTitle: string
  rating: number
  comment: string
  timestamp: string
  response?: string
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresponded'>('all')
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setReviews(data.data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId)
    if (review) {
      setRespondingTo(reviewId)
      setResponseText(review.response || '')
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!respondingTo || !responseText.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/reviews/${respondingTo}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseText })
      })

      const data = await response.json()
      if (data.success) {
        setMessage('Response submitted successfully!')
        fetchReviews()
        setRespondingTo(null)
        setResponseText('')
      } else {
        setMessage(data.message || 'Failed to submit response')
      }
    } catch (error) {
      setMessage('Error submitting response. Please try again.')
      console.error('Error submitting response:', error)
    }
  }

  const handleCancelResponse = () => {
    setRespondingTo(null)
    setResponseText('')
    setMessage('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-gray-600">({rating})</span>
      </div>
    )
  }

  const filteredReviews = reviews.filter(review => 
    filter === 'all' || !review.response
  )

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }))

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <Link to="/inbox" className="text-blue-600 hover:underline">Back to Inbox</Link>
      </div>
      
      {reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                <div className="flex justify-center mt-1">
                  {renderStars(Math.round(averageRating))}
                </div>
                <div className="mt-1 text-gray-600">{reviews.length} reviews</div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center">
                    <div className="w-10 text-sm text-gray-600">{rating} star</div>
                    <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-10 text-sm text-gray-600 text-right">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilter('unresponded')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'unresponded' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unresponded
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading reviews...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {review.customerAvatar ? (
                        <img className="h-10 w-10 rounded-full" src={review.customerAvatar} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {review.customerName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">{review.customerName}</h4>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formatDate(review.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{review.serviceTitle}</p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-700">{review.comment}</p>
                </div>
                
                {review.response && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-blue-800">Your Response</h4>
                      <span className="text-xs text-blue-600">
                        {formatDate(review.response)}
                      </span>
                    </div>
                    <p className="text-blue-700 mt-1">{review.response}</p>
                  </div>
                )}
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleRespond(review.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {review.response ? 'Edit Response' : 'Respond'}
                  </button>
                </div>
              </div>
              
              {respondingTo === review.id && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <form onSubmit={handleSubmitResponse}>
                    <div className="mb-3">
                      <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Response
                      </label>
                      <textarea
                        id="response"
                        rows={3}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="Write your response..."
                      />
                    </div>
                    
                    {message && <p className={`mb-3 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancelResponse}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Submit Response
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No reviews</h3>
          <p className="mt-1 text-gray-500">
            {filter === 'all' 
              ? "You don't have any reviews yet." 
              : "You don't have any unresponded reviews."}
          </p>
        </div>
      )}
    </div>
  )
}
