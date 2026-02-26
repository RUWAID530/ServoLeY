import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Shield, 
  Star, 
  Package, 
  Truck, 
  Users, 
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  ChevronRight,
  X,
  Plus,
  Info,
  Camera,
  FileCheck,
  Zap,
  Award,
  Target
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  required: boolean;
  documents?: string[];
  completedAt?: string;
  rejectionReason?: string;
}

interface VendorProfile {
  id: string;
  businessName: string;
  businessType: 'individual' | 'company' | 'partnership';
  category: string;
  description: string;
  logo?: string;
  coverImage?: string;
  establishedYear: number;
  teamSize: number;
  website?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  verificationStatus: 'not_started' | 'pending' | 'in_review' | 'verified' | 'rejected' | 'suspended';
  verificationLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  ratings: {
    average: number;
    total: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number; };
  };
  stats: {
    totalProducts: number;
    activeListings: number;
    totalRevenue: number;
    customerSatisfaction: number;
    fulfillmentRate: number;
    responseTime: string;
  };
  documents: {
    businessRegistration?: string;
    gstCertificate?: string;
    panCard?: string;
    addressProof?: string;
    bankAccount?: string;
    cancelledCheque?: string;
    idProof?: string;
    partnershipDeed?: string;
    qualityCertificate?: string;
    insuranceCertificate?: string;
  };
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifsc: string;
    accountType: 'savings' | 'current' | 'overdraft';
    upiId?: string;
  };
}

export default function VendorVerification() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'products' | 'analytics'>('profile');
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/vendor/login');
        return;
      }

      // Load vendor profile
      const profileResponse = await fetch(`${API_BASE}/api/vendor/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Load verification steps
      const verificationResponse = await fetch(`${API_BASE}/api/vendor/verification-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const profileData = await profileResponse.json();
      const verificationData = await verificationResponse.json();

      if (profileData.success) {
        setVendorProfile(profileData.data);
      }

      if (verificationData.success) {
        setVerificationSteps(verificationData.data);
      }

    } catch (error) {
      console.error('Error loading vendor data:', error);
      // Load mock data for demo
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockProfile: VendorProfile = {
      id: '1',
      businessName: 'Tech Solutions Pvt Ltd',
      businessType: 'company',
      category: 'Electronics',
      description: 'Leading supplier of electronic components and gadgets',
      logo: 'https://picsum.photos/seed/logo123/200/200.jpg',
      coverImage: 'https://picsum.photos/seed/cover456/800/400.jpg',
      establishedYear: 2018,
      teamSize: 50,
      website: 'https://techsolutions.example.com',
      email: 'contact@techsolutions.com',
      phone: '+91-9876543210',
      address: {
        street: '123, Tech Park, Phase 2',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        country: 'India'
      },
      verificationStatus: 'in_review',
      verificationLevel: 'standard',
      ratings: {
        average: 4.2,
        total: 1247,
        distribution: { 5: 89, 4: 234, 3: 456, 2: 312, 1: 156 }
      },
      stats: {
        totalProducts: 1247,
        activeListings: 892,
        totalRevenue: 2847500,
        customerSatisfaction: 94.5,
        fulfillmentRate: 96.8,
        responseTime: '2-4 hours'
      },
      documents: {
        businessRegistration: 'https://example.com/docs/business-reg.pdf',
        gstCertificate: 'https://example.com/docs/gst.pdf',
        panCard: 'https://example.com/docs/pan.pdf',
        addressProof: 'https://example.com/docs/address.pdf',
        bankAccount: 'https://example.com/docs/bank.pdf'
      },
      bankDetails: {
        accountNumber: '1234567890',
        bankName: 'State Bank of India',
        ifsc: 'SBIN0001234',
        accountType: 'current',
        upiId: 'techsolutions@paytm'
      }
    };

    const mockVerificationSteps: VerificationStep[] = [
      {
        id: '1',
        title: 'Basic Information',
        description: 'Complete your business profile with basic details',
        status: 'completed',
        required: true,
        completedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Document Upload',
        description: 'Upload required business and legal documents',
        status: 'completed',
        required: true,
        documents: ['business_registration', 'gst_certificate', 'pan_card', 'address_proof'],
        completedAt: '2024-01-16T14:20:00Z'
      },
      {
        id: '3',
        title: 'Bank Account Verification',
        description: 'Verify your bank account for payments',
        status: 'completed',
        required: true,
        documents: ['bank_account'],
        completedAt: '2024-01-17T11:45:00Z'
      },
      {
        id: '4',
        title: 'Quality Check',
        description: 'Our team will review your business for quality standards',
        status: 'in_progress',
        required: true,
        documents: []
      },
      {
        id: '5',
        title: 'Final Approval',
        description: 'Final verification and approval by our review team',
        status: 'pending',
        required: true,
        documents: []
      }
    ];

    setVendorProfile(mockProfile);
    setVerificationSteps(mockVerificationSteps);
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    try {
      setUploadingDoc(documentType);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const response = await fetch(`${API_BASE}/api/vendor/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        if (vendorProfile) {
          setVendorProfile({
            ...vendorProfile,
            documents: {
              ...vendorProfile.documents,
              [documentType]: data.data.url
            }
          });
        }
        
        setMessage({ type: 'success', text: 'Document uploaded successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setMessage({ type: 'error', text: 'Failed to upload document. Please try again.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setUploadingDoc(null);
    }
  };

  const saveProfile = async () => {
    if (!vendorProfile) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE}/api/vendor/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendorProfile)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getVerificationProgress = () => {
    const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
    const totalRequiredSteps = verificationSteps.filter(step => step.required).length;
    return (completedSteps / totalRequiredSteps) * 100;
  };

  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
      case 'standard': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'premium': return 'text-purple-400 bg-purple-400/20 border-purple-400/30';
      case 'enterprise': return 'text-amber-400 bg-amber-400/20 border-amber-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getDocumentIcon = (docType: string) => {
    switch (docType) {
      case 'business_registration': return <FileText className="w-5 h-5" />;
      case 'gst_certificate': return <FileCheck className="w-5 h-5" />;
      case 'pan_card': return <Shield className="w-5 h-5" />;
      case 'address_proof': return <Package className="w-5 h-5" />;
      case 'bank_account': return <Users className="w-5 h-5" />;
      case 'id_proof': return <Camera className="w-5 h-5" />;
      case 'partnership_deed': return <Award className="w-5 h-5" />;
      case 'quality_certificate': return <Star className="w-5 h-5" />;
      case 'insurance_certificate': return <Shield className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getDocumentName = (docType: string) => {
    switch (docType) {
      case 'business_registration': return 'Business Registration';
      case 'gst_certificate': return 'GST Certificate';
      case 'pan_card': return 'PAN Card';
      case 'address_proof': return 'Address Proof';
      case 'bank_account': return 'Bank Account';
      case 'id_proof': return 'ID Proof';
      case 'partnership_deed': return 'Partnership Deed';
      case 'quality_certificate': return 'Quality Certificate';
      case 'insurance_certificate': return 'Insurance Certificate';
      default: return 'Document';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Vendor Verification</h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs rounded-full border ${
                  vendorProfile?.verificationStatus === 'verified' 
                    ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                    : vendorProfile?.verificationStatus === 'in_review'
                    ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                    : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                }`}>
                  {vendorProfile?.verificationStatus?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
                </span>
                <span className={`px-3 py-1 text-xs rounded-full border ${getVerificationLevelColor(vendorProfile?.verificationLevel || 'basic')}`}>
                  {vendorProfile?.verificationLevel?.toUpperCase() || 'BASIC'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/vendor/dashboard')}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30' :
            message.type === 'error' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
            'bg-blue-600/20 text-blue-400 border-blue-600/30'
          }`}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {message.type === 'info' && <Info className="w-5 h-5" />}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Profile Card */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Business Profile</h2>
                <button
                  onClick={() => navigate('/vendor/edit-profile')}
                  className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              {vendorProfile && (
                <div className="space-y-4">
                  {/* Logo and Cover */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center">
                      {vendorProfile.logo ? (
                        <img src={vendorProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-700">
                        {vendorProfile.coverImage ? (
                          <img src={vendorProfile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Business Name</p>
                      <p className="font-medium text-white">{vendorProfile.businessName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Business Type</p>
                      <p className="font-medium text-white capitalize">{vendorProfile.businessType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Category</p>
                      <p className="font-medium text-white">{vendorProfile.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Established</p>
                      <p className="font-medium text-white">{vendorProfile.establishedYear}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-400">Description</p>
                    <p className="text-white">{vendorProfile.description}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <p className="font-medium text-white">{vendorProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Phone</p>
                      <p className="font-medium text-white">{vendorProfile.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Website</p>
                      <a href={vendorProfile.website} className="font-medium text-cyan-400 hover:text-cyan-300">
                        {vendorProfile.website}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Team Size</p>
                      <p className="font-medium text-white">{vendorProfile.teamSize} employees</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Progress */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Verification Progress</h2>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">Overall Progress</span>
                  <span className="text-lg font-bold text-white">{getVerificationProgress()}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getVerificationProgress()}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                {verificationSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-emerald-600/20' :
                      step.status === 'in_progress' ? 'bg-yellow-600/20' :
                      step.status === 'rejected' ? 'bg-red-600/20' :
                      'bg-slate-600/20'
                    }`}>
                      {step.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                       step.status === 'in_progress' ? <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" /> :
                       step.status === 'rejected' ? <X className="w-4 h-4 text-red-400" /> :
                       <Clock className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div>
                        <p className="font-medium text-white">{step.title}</p>
                        <p className="text-xs text-slate-400">{step.description}</p>
                      </div>
                      {step.documents && step.documents.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {step.documents.map((doc, docIndex) => (
                            <span key={docIndex} className="px-2 py-1 bg-slate-600 text-xs rounded text-cyan-400">
                              {doc.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        step.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400' :
                        step.status === 'in_progress' ? 'bg-yellow-600/20 text-yellow-400' :
                        step.status === 'rejected' ? 'bg-red-600/20 text-red-400' :
                        'bg-slate-600/20 text-slate-400'
                      }`}>
                        {step.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
              
              {vendorProfile && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total Products</span>
                    <span className="text-lg font-bold text-white">{vendorProfile.stats.totalProducts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Active Listings</span>
                    <span className="text-lg font-bold text-emerald-400">{vendorProfile.stats.activeListings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Revenue</span>
                    <span className="text-lg font-bold text-emerald-400">₹{vendorProfile.stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-400">{vendorProfile.stats.customerSatisfaction}%</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Fulfillment Rate</span>
                    <span className="text-lg font-bold text-blue-400">{vendorProfile.stats.fulfillmentRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Response Time</span>
                    <span className="text-lg font-bold text-cyan-400">{vendorProfile.stats.responseTime}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Level Benefits */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Verification Benefits</h2>
              
              <div className="space-y-3">
                {[
                  { level: 'basic', title: 'Basic', benefits: ['List up to 10 products', 'Basic seller badge'] },
                  { level: 'standard', title: 'Standard', benefits: ['List up to 50 products', 'Standard seller badge', 'Priority support'] },
                  { level: 'premium', title: 'Premium', benefits: ['Unlimited products', 'Premium seller badge', 'Featured listings', 'Dedicated support'] },
                  { level: 'enterprise', title: 'Enterprise', benefits: ['Custom solutions', 'Enterprise badge', 'API access', 'Account manager'] }
                ].map((tier) => (
                  <div key={tier.level} className={`p-3 rounded-lg border ${
                    vendorProfile?.verificationLevel === tier.level 
                      ? 'bg-cyan-600/20 border-cyan-600/30' 
                      : 'bg-slate-700 border-slate-600'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{tier.title}</span>
                      {vendorProfile?.verificationLevel === tier.level && (
                        <span className="px-2 py-1 bg-cyan-600 text-white text-xs rounded">Current</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-slate-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowDocumentModal(true)}
                  className="w-full flex items-center justify-between p-3 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg transition-colors border border-cyan-600/30"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span className="text-white">Upload Documents</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </button>
                
                <button
                  onClick={() => navigate('/vendor/products')}
                  className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="text-white">Manage Products</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                
                <button
                  onClick={() => navigate('/vendor/analytics')}
                  className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span className="text-white">View Analytics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full flex items-center justify-between p-3 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg transition-colors border border-emerald-600/30 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span className="text-emerald-400">Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Save Profile</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 m-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Documents</h3>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'business_registration', required: true, description: 'Business Registration Certificate' },
                { key: 'gst_certificate', required: true, description: 'GST Certificate' },
                { key: 'pan_card', required: true, description: 'PAN Card' },
                { key: 'address_proof', required: true, description: 'Address Proof' },
                { key: 'bank_account', required: true, description: 'Bank Account Details' },
                { key: 'id_proof', required: true, description: 'Government ID Proof' },
                { key: 'partnership_deed', required: false, description: 'Partnership Deed (if applicable)' },
                { key: 'quality_certificate', required: false, description: 'Quality Certifications' },
                { key: 'insurance_certificate', required: false, description: 'Insurance Certificate' }
              ].map((doc) => (
                <div key={doc.key} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {getDocumentIcon(doc.key)}
                    <div>
                      <p className="font-medium text-white">{doc.description}</p>
                      <p className="text-xs text-slate-400">
                        {doc.required ? 'Required for verification' : 'Optional - enhances profile'}
                      </p>
                    </div>
                    {vendorProfile?.documents && vendorProfile.documents[doc.key as keyof typeof vendorProfile.documents] ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 text-sm">Uploaded</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDocument(doc.key);
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.jpg,.jpeg,.png';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handleDocumentUpload(doc.key, file);
                            }
                          };
                          input.click();
                        }}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload
                      </button>
                    )}
                  </div>
                  
                  {uploadingDoc === doc.key && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Uploading {doc.description}...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
