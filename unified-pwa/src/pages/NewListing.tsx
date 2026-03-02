
import React, { useState, useMemo, useRef } from 'react';
import { 
  ChevronDown, 
  Search, 
  X, 
  Camera, 
  Info, 
  MapPin, 
  Circle,
  Plus,
  Check
} from 'lucide-react';
import { ListingService } from '../types/Index';
import { listService, uploadImage } from '../services/api_exports';
import { useNavigate } from 'react-router-dom';
import { useProviderProfile } from '../contexts/ProviderProfileContext';
import { resolveMediaUrl } from '../utils/media';




// Helper Components
// Fixed: Explicitly typed as React.FC and made children optional to avoid "missing children" and "missing key" TS errors
const Card: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 ${className}`}>
    {children}
  </div>
);

// Fixed: Explicitly typed as React.FC and made children optional to avoid "missing children" TS errors
const ServiceSection: React.FC<{ title: string; description?: string; badge?: string; children?: React.ReactNode }> = ({ title, description, badge, children }) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-1">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {badge && <span className="text-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30">{badge}</span>}
    </div>
    {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
    {children}
  </div>
);

const NewListing: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const { state: profileState } = useProviderProfile();

    const providerDisplayName = (profileState.profile?.displayName || 'Provider').trim();
    const providerAvatarUrl = (profileState.profile?.profilePhoto || '').trim();


  
  const triggerFileInput = (serviceId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        handleImageUpload(serviceId, file);
      }
      // Clean up input element after use
      document.body.removeChild(input);
    };
    // Add to DOM temporarily to ensure it works in all browsers
    document.body.appendChild(input);
    input.click();
  };
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(12);
  const [location, setLocation] = useState("Your Service Area");
  
  // Professional service categories
  const serviceCategories = [
    "General Services",
    "Home Services", 
    "Electronics Repair",
    "Vehicle Services",
    "Beauty & Wellness",
    "Education & Training",
    "Business Services",
    "Healthcare Services",
    "Event Services",
    "Digital Services"
  ];
  
  // Service templates for each category
  const categoryServices: {[key: string]: string[]} = {
    "General Services": ["Consultation", "Installation", "Maintenance", "Repair", "Inspection"],
    "Home Services": ["Plumbing", "Electrical Work", "Painting", "Cleaning", "Carpentry"],
    "Electronics Repair": ["Phone Repair", "Laptop Repair", "TV Repair", "Audio System", "Gadget Repair"],
    "Vehicle Services": ["Car Repair", "Bike Service", "AC Service", "Wash & Detail", "Tire Service"],
    "Beauty & Wellness": ["Hair Styling", "Massage", "Skincare", "Nail Care", "Fitness Training"],
    "Education & Training": ["Tutoring", "Music Lessons", "Language Training", "Computer Skills", "Career Coaching"],
    "Business Services": ["Accounting", "Legal Services", "Marketing", "Web Design", "Consulting"],
    "Healthcare Services": ["Medical Consultation", "Physiotherapy", "Dental Care", "Eye Care", "Mental Health"],
    "Event Services": ["Photography", "Catering", "Event Planning", "Decoration", "Entertainment"],
    "Digital Services": ["Software Development", "Content Writing", "Social Media", "SEO", "Graphic Design"]
  };
  
  const [selectedServices, setSelectedServices] = useState<ListingService[]>([]);

  const availableServices = category ? (categoryServices[category] || []) : [];

  // Filter services based on search query
  const filteredServices = availableServices.filter(service => 
    service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleService = (serviceName: string) => {
    if (selectedServices.find(s => s.name === serviceName)) {
      setSelectedServices(selectedServices.filter(s => s.name !== serviceName));
    } else {
      setSelectedServices([...selectedServices, {
        id: Math.random().toString(36).substr(2, 9),
        name: serviceName,
        description: "",
        visitChargeEnabled: false,
        serviceOnlyPrice: false
      }]);
    }
  };

  const handleAddCustomService = () => {
    if (!category) {
      alert('Please select a category first.');
      return;
    }

    const customName = window.prompt('Enter custom service name');
    const normalizedName = String(customName || '').trim();
    if (!normalizedName) return;

    if (selectedServices.find((s) => s.name.toLowerCase() === normalizedName.toLowerCase())) {
      alert('This service is already selected.');
      return;
    }

    setSelectedServices((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 11),
        name: normalizedName,
        description: '',
        visitChargeEnabled: false,
        serviceOnlyPrice: false
      }
    ]);
  };

  const handleUpdateService = (id: string, updates: Partial<ListingService>) => {
    setSelectedServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleImageUpload = async (id: string, file: File) => {
    if (!file) return;
    
    // Create a temporary preview URL immediately for better UX
    const previewUrl = URL.createObjectURL(file);
    handleUpdateService(id, { image: previewUrl });
    
    try {
      const response = await uploadImage(file);
      if (!response?.success) {
        throw new Error(response?.message || 'Image upload failed');
      }
      
      // Handle the actual response structure: { success: true, data: { url: string } }
      const imageUrl = String(response?.data?.url || '').trim();
      if (!imageUrl) {
        throw new Error('Image upload completed but URL was missing');
      }
      
      // Replace the preview URL with the actual uploaded URL
      handleUpdateService(id, { image: imageUrl });
      
      // Clean up the preview URL after a short delay to allow UI to update
      setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image. Please try again.';
      alert(message);
      // Don't revoke the preview URL on error so the user can still see the image
    }
  };

  const handleSubmit = async () => {
    try {
      // Get user-specific token
      const userId = localStorage.getItem('userId');
      const sessionId = localStorage.getItem('currentSessionId') || 'default';
      const token = localStorage.getItem(`token_${userId}_${sessionId}`) || localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Please log in to create services');
        navigate('/auth');
        return;
      }
      
      // Validate all services before submission
      if (!category) {
        throw new Error('Please select a service category');
      }

      for (const service of selectedServices) {
        if (!service.name || service.name.trim() === '') {
          throw new Error('Service name is required');
        }
        if (!service.price || service.price <= 0) {
          throw new Error(`Please set a valid price for "${service.name}"`);
        }
        if (!service.description || service.description.trim() === '') {
          throw new Error(`Please add a description for "${service.name}"`);
        }
      }
      
      // Submit each service to API
      let finalStatus: 'pending_verification' | 'offline' | 'success' = 'success';
      let lastServiceId: string | undefined;
      for (const service of selectedServices) {
        const serviceData = {
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration || 60, // Default 60 minutes
          category: category,
          image: service.image
        };

        const response = await listService(serviceData);
        
        // ✅ COMPREHENSIVE VERIFICATION LOGGING
        console.log('🎯 SERVICE CREATION VERIFICATION:');
        console.log('📋 Full response:', response);
        console.log('📋 Response data:', response.data);
        console.log('📋 Response success:', response.success);
        
        // Check different possible response structures
        const extractedServiceData = response.data?.service || response.data?.data?.service || response.data;
        const serviceId = extractedServiceData?.id;
        const serviceStatus = response.data?.status || response.data?.data?.status || extractedServiceData?.status;
        lastServiceId = serviceId || lastServiceId;
        
        console.log('📋 Service data extracted:', extractedServiceData);
        console.log('📋 Service ID:', serviceId);
        console.log('📋 Service status:', serviceStatus);
        
        // Verify service was actually created
        if (serviceId) {
          console.log('✅ Service successfully created with ID:', serviceId);
          console.log('📤 Service sent to admin dashboard for verification');
        } else {
          console.log('❌ WARNING: Service may not have been created properly');
          console.log('❌ Response structure:', JSON.stringify(response, null, 2));
        }

        if (!response.success) {
          throw new Error(response.message || 'Failed to create service');
        }

        if (serviceStatus === 'pending_verification') {
          finalStatus = 'pending_verification';
        } else if (serviceStatus === 'offline') {
          finalStatus = 'offline';
        }
      }

      if (finalStatus === 'pending_verification') {
        alert('✅ Service successfully created and sent to admin dashboard for verification!\n\n' +
              'Service ID: ' + (lastServiceId || 'Unknown') + '\n' +
              'Status: Pending Verification\n\n' +
              'The admin will review your service shortly. You will be notified once approved.');
        navigate('/provider/services?status=pending_verification');
      } else if (finalStatus === 'offline') {
        alert('✅ Service saved offline!\n\n' +
              'Service ID: ' + (lastServiceId || 'Unknown') + '\n' +
              'Status: Offline Mode\n\n' +
              'Your service will be synced when connection is restored.');
        navigate('/provider/services?status=offline');
      } else {
        alert('✅ Service successfully created!\n\n' +
              'Service ID: ' + (lastServiceId || 'Unknown') + '\n' +
              'Status: Submitted\n\n' +
              'Your service has been submitted successfully!');
        navigate('/provider/services');
      }
    } catch (error) {
      alert(`Failed to publish services: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const getFormValidationMessage = () => {
    if (!category) {
      return "Please select a service category";
    }

    if (selectedServices.length === 0) {
      return "Please select at least one service";
    }

    const missingPrice = selectedServices.find(s => s.price === undefined || s.price === null || s.price <= 0);
    if (missingPrice) {
      return `Please set a price for "${missingPrice.name}"`;
    }
    
    const missingDescription = selectedServices.find(s => !s.description || s.description.trim().length === 0);
    if (missingDescription) {
      return `Please add a description for "${missingDescription.name}"`;
    }
    
    const missingImage = selectedServices.find(s => !s.image);
    if (missingImage) {
      return `Please upload an image for "${missingImage.name}"`;
    }
    
    return "Ready to publish!";
  };

  const isFormValid = useMemo(() => {
    const hasCategory = !!category;
    const hasSelectedServices = selectedServices.length > 0;
    const allServicesHavePrice = selectedServices.every(s => s.price !== undefined && s.price !== null && s.price > 0);
    const allServicesHaveDescription = selectedServices.every(s => s.description && s.description.trim().length > 0);
    const allServicesHaveImage = selectedServices.every(s => s.image);
    
    return hasCategory && hasSelectedServices && allServicesHavePrice && allServicesHaveDescription && allServicesHaveImage;
  }, [category, selectedServices]);

    return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-6 py-4 flex justify-between items-center bg-[#010816] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center font-bold text-slate-900">
            S
          </div>
          <h1 className="text-lg font-bold text-white">
            ServoLey <span className="font-normal text-slate-400">Partner</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">
              {providerDisplayName} · Pro Partner
            </p>
          </div>
          {providerAvatarUrl ? (
            <img
              src={providerAvatarUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-700 flex items-center justify-center text-sm font-semibold text-white">
              {providerDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </nav>
      {/* ...rest of the component... */}


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="mb-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">List Your Services</h1>
                <p className="text-slate-400">Add all services you provide in one place. You can update these anytime.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-teal-400 font-medium mb-1">Step 1 of 3</p>
                <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-teal-400"></div>
                </div>
              </div>
            </div>
          </div>

          <ServiceSection title="Service category">
             <Card>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm text-slate-400">Category</label>
                  <span className="flex items-center gap-1.5 text-xs text-teal-400">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full"></div>
                  </span>
                </div>
                <div className="relative">
                  <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-teal-400">
                    <Circle className="w-4 h-4" />
                  </div>
                  <select 
                    className="w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all duration-300 appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setCategory(nextCategory);
                      setSearchQuery('');
                      setSelectedServices([]);
                    }}
                  >
                    <option value="" disabled>Select a category</option>
                    {serviceCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm text-slate-400">Select services</label>
                    <span className="text-xs text-slate-500 italic">
                      {category ? `Pick all of your ${category.toLowerCase()} services` : 'Select a category to see services'}
                    </span>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder={category ? `Search ${category.toLowerCase()} services...` : 'Search services...'} 
                      className="w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all duration-300"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {filteredServices.map(service => (
                      <button 
                        key={service}
                        onClick={() => handleToggleService(service)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                          selectedServices.find(s => s.name === service)
                          ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border border-teal-500/50'
                          : 'bg-gradient-to-r from-white/10 to-white/5 text-slate-400 border border-white/20 hover:border-teal-500/50 hover:text-teal-400'
                        }`}
                      >
                        {service}
                        {selectedServices.find(s => s.name === service) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddCustomService}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-white/10 to-white/5 text-slate-400 border border-white/20 hover:border-teal-500/50 hover:text-teal-400 transition-all duration-300"
                    >
                      <Plus className="w-3 h-3" /> Add custom service
                    </button>
                  </div>
                </div>
             </Card>
          </ServiceSection>

          <ServiceSection title="Service details" badge={`${selectedServices.length} services selected`}>
            <div className="space-y-4">
              {selectedServices.map((service) => (
                <Card key={service.id} className="relative overflow-hidden group">
                  <button 
                    onClick={() => handleToggleService(service.name)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <p className="text-xs text-slate-500">Typical booking: 30-60 mins · High demand in your area</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Price & Description */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Price (₹) <span className="text-teal-500">Required</span></label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                            <input 
                              type="number" 
                              value={service.price || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = value === '' ? undefined : parseInt(value) || 0;
                                handleUpdateService(service.id, { price: numValue });
                              }}
                              placeholder="Enter amount"
                              className="w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg py-2 pl-8 pr-4 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all duration-300"
                            />
                          </div>
                          <p className="mt-1.5 text-[10px] text-slate-500">Enter service charge only. <span className="text-teal-400 cursor-pointer">Product/spare cost excluded.</span></p>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Short description</label>
                          <textarea 
                            rows={3}
                            value={service.description}
                            onChange={(e) => handleUpdateService(service.id, { description: e.target.value })}
                            placeholder="Write a short line about what is included, and any exclusions."
                            className="w-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg p-3 text-sm placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:bg-white/10 transition-all duration-300 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                         <div 
                          onClick={() => handleUpdateService(service.id, { serviceOnlyPrice: !service.serviceOnlyPrice })}
                          className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${service.serviceOnlyPrice ? 'bg-teal-500 border-teal-500' : 'border-slate-700 bg-slate-800'}`}
                         >
                           {service.serviceOnlyPrice && <Check className="w-3.5 h-3.5 text-slate-900" />}
                         </div>
                         <span className="text-sm text-slate-400">Price applies to service only (no product cost)</span>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="md:col-span-4 flex flex-col">
                       <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Service photo <span className="text-teal-500">Required</span></label>
                       <div className={`flex-1 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${service.image ? 'border-teal-500/50 bg-teal-500/5' : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'} cursor-pointer`}
                             onClick={() => triggerFileInput(service.id)}
                        >

                          {service.image && !service.image.startsWith('blob:') ? (
                            <div className="relative w-full h-full flex flex-col items-center">
                              <img 
                                src={resolveMediaUrl(service.image, service.image)}
                                alt="Service" 
                                className="w-16 h-16 rounded object-cover mb-2"
                                onError={(e) => {
                                  console.error('Image failed to load:', service.image);
                                  // Fallback to a placeholder if image fails
                                  e.currentTarget.src = 'https://picsum.photos/seed/fallback/100/100';
                                }}
                              />
                              <button className="text-[10px] text-teal-400 font-medium">Replace image</button>
                            </div>
                          ) : service.image && service.image.startsWith('blob:') ? (
                            <div className="relative w-full h-full flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-teal-500"></div>
                              </div>
                              <p className="text-[10px] text-teal-400 font-medium">Processing...</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-3">
                                <Camera className="w-5 h-5 text-slate-500" />
                              </div>
                              <p className="text-xs font-medium text-slate-300">Drag & drop or click to upload</p>
                              <p className="text-[10px] text-slate-500 mt-1">JPG or PNG only. Real photos of your work perform best.</p>
                            </>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Visit Charge Toggle */}
                  <div className="mt-6 flex justify-end items-center gap-4 pt-4 border-t border-slate-800">
                    <span className="text-xs text-slate-400">Visit charge applicable</span>
                    <button 
                      onClick={() => handleUpdateService(service.id, { visitChargeEnabled: !service.visitChargeEnabled })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${service.visitChargeEnabled ? 'bg-teal-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${service.visitChargeEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </ServiceSection>

          <ServiceSection title="Service area & coverage">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm text-slate-400">Base location</label>
                <span className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                  <Circle className="w-2 h-2 fill-teal-400" /> Live location supported
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    <span>Base location</span>
                    <button className="text-teal-400">Auto-detect or edit manually</button>
                  </div>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm focus:outline-none" 
                    />
                    <button className="text-teal-400 text-xs font-medium">Auto-detect</button>
                  </div>

                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest">Service radius</label>
                      <span className="text-sm font-bold text-white">{radius} km</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      value={radius} 
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                      <span>1 km</span>
                      <span>30 km</span>
                    </div>
                  </div>
                </div>

                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                   {/* Simulated Map */}
                   <div className="absolute inset-0 opacity-40">
                      <div className="w-full h-full bg-[url('https://picsum.photos/seed/map/600/400')] bg-cover bg-center"></div>
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-teal-500/10 border-2 border-teal-400 animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-teal-400 rounded-full border-2 border-slate-900 shadow-xl shadow-teal-500/50"></div>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          </ServiceSection>
        </div>

        {/* Right Column: Summary & Tips */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Listing summary</h3>
              <span className="text-[10px] text-slate-500">Auto-updates as you fill</span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Category</span>
                <span className="text-sm font-bold text-white">{category || 'Not selected'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total services</span>
                <span className="text-sm font-bold text-white">{selectedServices.length} selected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Price range</span>
                <span className="text-sm font-bold text-white">
                  {selectedServices.some(s => s.price) 
                    ? `₹${Math.min(...selectedServices.map(s => s.price || Infinity))} - ₹${Math.max(...selectedServices.map(s => s.price || 0))}` 
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Coverage radius</span>
                <span className="text-sm font-bold text-white">{radius} km</span>
              </div>
            </div>

            <div className={`p-3 rounded-lg flex items-center gap-2.5 transition-colors ${isFormValid ? 'bg-teal-900/20 text-teal-400 border border-teal-500/30' : 'bg-slate-800/50 text-slate-500 border border-slate-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isFormValid ? 'bg-teal-400' : 'bg-slate-600'}`}></div>
              <span className="text-xs font-medium">
                {getFormValidationMessage()}
              </span>
            </div>
          </Card>

          <div className="bg-amber-900/10 border border-amber-900/30 rounded-xl p-5 flex gap-4">
             <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
               <Info className="w-4 h-4 text-amber-500" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-amber-200 mb-1">Tip for better bookings</h4>
               <p className="text-xs text-slate-400 leading-relaxed">
                 Real photos and clear pricing help customers trust you. Providers who add photos for each service see up to 40% more confirmed jobs.
               </p>
             </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#010816]/95 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex justify-between items-center z-50">
        <p className="text-xs text-slate-400 hidden sm:block">Complete all required fields to enable publishing.</p>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
            Save as draft
          </button>
          <button 
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`flex-1 sm:flex-none px-10 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg ${
              isFormValid 
              ? 'bg-teal-500 text-slate-900 hover:bg-teal-400 shadow-teal-500/20 active:scale-95' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            Publish services
          </button>
        </div>
      </footer>
    </div>
  );
}

export default NewListing;
