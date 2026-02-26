import React, { useState, useEffect } from 'react'
import { API_BASE } from '../config/api'
import { useAuth } from '../hooks/useAuth'

interface Review {
  id: string
  customerId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_BASE}/reviews`, {
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
        setMessage('Error loading reviews')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [token])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ))
  }

  if (loading) {
    return <div className="p-4">Loading reviews...</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Customer Reviews</h1>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">
          {message}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          No reviews yet
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">{review.customerName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
              </div>

              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
