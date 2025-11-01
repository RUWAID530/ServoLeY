import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../App'

interface RequirementForm {
  serviceType: string;
  title: string;
  description: string;
  location: string;
  budget: string;
  urgency: string;
  contactPreference: string;
}

export default function PostRequirement() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<RequirementForm>({
    serviceType: '',
    title: '',
    description: '',
    location: '',
    budget: '',
    urgency: 'normal',
    contactPreference: 'phone'
  });

  const serviceTypes = [
    { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
    { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
    { id: 'pest-control', name: 'Pest Control', icon: '🐜' },
    { id: 'electrician', name: 'Electrician', icon: '💡' },
    { id: 'painting', name: 'Painting', icon: '🎨' },
    { id: 'carpentry', name: 'Carpentry', icon: '🔨' },
    { id: 'gardening', name: 'Gardening', icon: '🌳' },
    { id: 'moving', name: 'Moving', icon: '🚚' },
    { id: 'appliance-repair', name: 'Appliance Repair', icon: '🔌' },
    { id: 'home-security', name: 'Home Security', icon: '🔐' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Your requirement has been posted successfully! Providers will contact you soon.');
        // Reset form after successful submission
        setForm({
          serviceType: '',
          title: '',
          description: '',
          location: '',
          budget: '',
          urgency: 'normal',
          contactPreference: 'phone'
        });
      } else {
        setMessage(data.message || 'Failed to post requirement. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please try again later.');
      console.error('Error posting requirement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-medium">Post a Requirement</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type Selection */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Select Service Type</h2>
            <div className="grid grid-cols-3 gap-3">
              {serviceTypes.map(service => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, serviceType: service.id }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    form.serviceType === service.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{service.icon}</span>
                  <span className="text-xs font-medium">{service.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              placeholder="Brief title for your requirement"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Provide details about your requirement"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={form.location}
              onChange={handleInputChange}
              placeholder="Your address or area"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              Budget (Optional)
            </label>
            <input
              type="text"
              id="budget"
              name="budget"
              value={form.budget}
              onChange={handleInputChange}
              placeholder="e.g., $100-200 or Negotiable"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Urgency */}
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              id="urgency"
              name="urgency"
              value={form.urgency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low - Within a month</option>
              <option value="normal">Normal - Within 2 weeks</option>
              <option value="high">High - Within a week</option>
              <option value="urgent">Urgent - Within 24 hours</option>
            </select>
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Contact Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contactPreference"
                  value="phone"
                  checked={form.contactPreference === 'phone'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>Phone Call</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contactPreference"
                  value="email"
                  checked={form.contactPreference === 'email'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contactPreference"
                  value="chat"
                  checked={form.contactPreference === 'chat'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>In-App Chat</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !form.serviceType || !form.title || !form.description || !form.location}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
