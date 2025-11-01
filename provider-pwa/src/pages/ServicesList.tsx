
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../App';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  brands: string[];
}
interface ApiResponse {
  data: {
    services: Service[];
  };
  message?: string;
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [error, setError] = useState('');

  // Form state for adding a new service
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'MOBILE_SERVICE',
    price: '',
    brands: '',
  });

  const [brandsList, setBrandsList] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
  try {
    const response = await axios.get<ApiResponse>(`${API_BASE}/api/provider/services`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    setServices(response.data.data.services);
    setLoading(false);
  } catch (err: any) {
    setError(err?.response?.data?.message || 'Failed to fetch services');
    setLoading(false);
  }
};


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addBrand = () => {
    if (brandInput.trim() && !brandsList.includes(brandInput.trim())) {
      setBrandsList([...brandsList, brandInput.trim()]);
      setBrandInput('');
    }
  };

  const removeBrand = (brandToRemove: string) => {
    setBrandsList(brandsList.filter(brand => brand !== brandToRemove));
  };

  const submitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const price = parseFloat(newService.price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        setLoading(false);
        return;
      }

      // Calculate price with 2% commission
      const priceWithCommission = price * 1.02;

      const response = await axios.post(`${API_BASE}/api/provider/services`, {
        name: newService.name,
        description: newService.description,
        category: newService.category,
        price: price,
        basePrice: price,
        brands: brandsList,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Reset form
      setNewService({
        name: '',
        description: '',
        category: 'MOBILE_SERVICE',
        price: '',
        brands: '',
      });
      setBrandsList([]);
      setShowAddServiceForm(false);

      // Refresh services list
      fetchServices();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await axios.delete(`${API_BASE}/api/provider/services/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Refresh services list
      fetchServices();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete service');
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
        <button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
          onClick={() => setShowAddServiceForm(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Service
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showAddServiceForm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={submitService}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Service</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Service Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newService.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Display Change"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newService.category}
                        onChange={handleInputChange}
                      >
                        <option value="MOBILE_SERVICE">Mobile Service</option>
                        <option value="PAINTER">Painter</option>
                        <option value="WATER_SERVICE">Water Service</option>
                        <option value="MECHANIC_SHOP">Mechanic Shop</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newService.description}
                        onChange={handleInputChange}
                        placeholder="Describe your service in detail"
                      />
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        required
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newService.price}
                        onChange={handleInputChange}
                        placeholder="1200"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Note: 2% platform commission will be added to the displayed price
                      </p>
                    </div>

                    <div>
                      <label htmlFor="brands" className="block text-sm font-medium text-gray-700">
                        Brands
                      </label>
                      <div className="mt-1 flex">
                        <input
                          type="text"
                          id="brands"
                          className="block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={brandInput}
                          onChange={(e) => setBrandInput(e.target.value)}
                          placeholder="e.g., Realme"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBrand())}
                        />
                        <button
                          type="button"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-r-md"
                          onClick={addBrand}
                        >
                          Add
                        </button>
                      </div>

                      {brandsList.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {brandsList.map((brand, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {brand}
                              <button
                                type="button"
                                className="ml-1 inline-flex text-indigo-400 hover:text-indigo-600"
                                onClick={() => removeBrand(brand)}
                              >
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Service'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowAddServiceForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new service.</p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowAddServiceForm(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Service
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {services.map((service) => (
              <li key={service.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate">{service.name}</p>
                    <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-2">Category: {service.category}</span>
                      <span className="mr-2">Price: ₹{service.price}</span>
                      <span className="text-green-600">Customer Price: ₹{(service.price * 1.02).toFixed(2)}</span>
                    </div>
                    {service.brands && service.brands.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {service.brands.map((brand, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-5">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-900"
                      onClick={() => deleteService(service.id)}
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
