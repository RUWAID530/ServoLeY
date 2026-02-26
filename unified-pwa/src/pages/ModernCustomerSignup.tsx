import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Shield, 
  CreditCard, 
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  MapPin
} from 'lucide-react';

const ModernCustomerSignup: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  // Verification data
  const [verificationData, setVerificationData] = useState({
    idType: '',
    idNumber: '',
    idFrontImage: null as File | null,
    idBackImage: null as File | null,
    addressProofType: '',
    addressProofNumber: '',
    addressProofImage: null as File | null
  });
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment form state
  const [paymentType, setPaymentType] = useState<'upi' | 'card'>('upi');
  const [upiProvider, setUpiProvider] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiDisplayName, setUpiDisplayName] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBank, setCardBank] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form
  useEffect(() => {
    const isValid = 
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword;
    
    setIsFormValid(isValid);
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Use a callback to ensure we're working with the latest state
    setFormData(currentFormData => {
      const newFormData = { ...currentFormData };
      
      // Special handling for phone number
      if (name === 'phone') {
        // Only allow digits and limit to 10 characters
        const phoneDigits = value.replace(/\D/g, '').slice(0, 10);
        newFormData[name as keyof typeof newFormData] = phoneDigits;
      } else {
        newFormData[name as keyof typeof newFormData] = value;
      }
      
      return newFormData;
    });
    
    // Clear messages on input
    setMessage('');
  };

  const showMessage = (text: string, type: 'error' | 'success' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentMethodSubmit = (paymentMethod: any) => {
    setPaymentMethods(prev => [...prev, paymentMethod]);
    setShowPaymentModal(false);
    showMessage('Payment method added successfully', 'success');
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that step 1 (personal information) is completed
    if (!isFormValid) {
      showMessage('Please complete your personal information before creating your account', 'error');
      setCurrentStep(1); // Redirect to step 1
      return;
    }
    
    setIsLoading(true);
    setMessage('Creating your account...');

    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        userType: 'CUSTOMER',
        paymentMethods
      };

      console.log('Submitting registration:', registrationData);
      
      const response = await authService.register(registrationData);
      
      if (response.success) {
        showMessage('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          navigate('/customer/home');
        }, 2000);
      } else {
        showMessage(response.message || 'Registration failed', 'error');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      showMessage(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="min-h-screen backdrop-blur-lg bg-black/20">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">ServoLeY</h1>
            <button 
              onClick={() => navigate('/login')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen px-4 pt-20">
          <div className="w-full max-w-4xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3, 4].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      currentStep >= step 
                        ? 'bg-white border-white text-indigo-900' 
                        : 'border-white/30 text-white/50'
                    }`}>
                      {currentStep > step ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="font-semibold">{step}</span>
                      )}
                    </div>
                    {step < 4 && (
                      <div className={`h-1 w-16 transition-all ${
                        currentStep > step ? 'bg-white' : 'bg-white/30'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-center mt-4 space-x-6 text-sm text-white/70">
                <span className={currentStep >= 1 ? 'text-white' : ''}>Personal Info</span>
                <span className={currentStep >= 2 ? 'text-white' : ''}>ID Verification</span>
                <span className={currentStep >= 3 ? 'text-white' : ''}>Payment Setup</span>
                <span className={currentStep >= 4 ? 'text-white' : ''}>Complete</span>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl text-center transition-all ${
                messageType === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/30' :
                messageType === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/30' :
                'bg-blue-500/20 text-blue-200 border border-blue-500/30'
              }`}>
                {message}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Create Your Account</h2>
                  <p className="text-white/70">Join thousands of customers using ServoLeY</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: ID Verification */}
            {currentStep === 2 && (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Verify Your Identity</h2>
                  <p className="text-white/70">Add your ID proof and address verification for secure transactions</p>
                </div>

                <div className="space-y-6">
                  {/* ID Proof Section */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">ID Proof</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">ID Type</label>
                        <select
                          value={verificationData.idType}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, idType: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        >
                          <option value="" className="bg-gray-800">Select ID Type</option>
                          <option value="aadhaar" className="bg-gray-800">Aadhaar Card</option>
                          <option value="pan" className="bg-gray-800">PAN Card</option>
                          <option value="voter" className="bg-gray-800">Voter ID</option>
                          <option value="driving" className="bg-gray-800">Driving License</option>
                          <option value="passport" className="bg-gray-800">Passport</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">ID Number</label>
                        <input
                          type="text"
                          value={verificationData.idNumber}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, idNumber: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                          placeholder="Enter ID number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Front Side</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setVerificationData(prev => ({ ...prev, idFrontImage: e.target.files?.[0] || null }))}
                            className="hidden"
                            id="id-front"
                          />
                          <label
                            htmlFor="id-front"
                            className="w-full p-4 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 transition-all cursor-pointer flex flex-col items-center justify-center"
                          >
                            {verificationData.idFrontImage ? (
                              <>
                                <Check className="w-6 h-6 text-green-400 mb-2" />
                                <span className="text-white text-sm">{verificationData.idFrontImage.name}</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-6 h-6 text-white/60 mb-2" />
                                <span className="text-white/60 text-sm">Upload Front Side</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Back Side</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setVerificationData(prev => ({ ...prev, idBackImage: e.target.files?.[0] || null }))}
                            className="hidden"
                            id="id-back"
                          />
                          <label
                            htmlFor="id-back"
                            className="w-full p-4 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 transition-all cursor-pointer flex flex-col items-center justify-center"
                          >
                            {verificationData.idBackImage ? (
                              <>
                                <Check className="w-6 h-6 text-green-400 mb-2" />
                                <span className="text-white text-sm">{verificationData.idBackImage.name}</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-6 h-6 text-white/60 mb-2" />
                                <span className="text-white/60 text-sm">Upload Back Side</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Proof Section */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Address Proof</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Address Proof Type</label>
                        <select
                          value={verificationData.addressProofType}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, addressProofType: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                        >
                          <option value="" className="bg-gray-800">Select Address Proof</option>
                          <option value="aadhaar" className="bg-gray-800">Aadhaar Card</option>
                          <option value="voter" className="bg-gray-800">Voter ID</option>
                          <option value="driving" className="bg-gray-800">Driving License</option>
                          <option value="passport" className="bg-gray-800">Passport</option>
                          <option value="utility" className="bg-gray-800">Utility Bill</option>
                          <option value="rent" className="bg-gray-800">Rent Agreement</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">Document Number</label>
                        <input
                          type="text"
                          value={verificationData.addressProofNumber}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, addressProofNumber: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                          placeholder="Enter document number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Upload Address Proof</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setVerificationData(prev => ({ ...prev, addressProofImage: e.target.files?.[0] || null }))}
                          className="hidden"
                          id="address-proof"
                        />
                        <label
                          htmlFor="address-proof"
                          className="w-full p-4 border-2 border-dashed border-white/30 rounded-xl hover:border-white/50 transition-all cursor-pointer flex flex-col items-center justify-center"
                        >
                          {verificationData.addressProofImage ? (
                            <>
                              <Check className="w-6 h-6 text-green-400 mb-2" />
                              <span className="text-white text-sm">{verificationData.addressProofImage.name}</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-6 h-6 text-white/60 mb-2" />
                              <span className="text-white/60 text-sm">Upload Address Proof Document</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <button
                      onClick={prevStep}
                      className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="px-6 py-3 bg-white text-indigo-900 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Skip Option */}
                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-white/60 hover:text-white/80 text-sm transition-colors"
                    >
                      Skip this step (you can verify your identity later)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Methods */}
            {currentStep === 3 && (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Setup Payment Methods</h2>
                  <p className="text-white/70">Add payment options for seamless transactions</p>
                </div>

                <div className="space-y-6">
                  {/* Payment Methods List */}
                  {paymentMethods.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">Your Payment Methods</h3>
                      {paymentMethods.map((method, index) => (
                        <div key={index} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {method.type === 'upi' ? (
                              <Smartphone className="w-6 h-6 text-blue-400" />
                            ) : (
                              <CreditCard className="w-6 h-6 text-green-400" />
                            )}
                            <div>
                              <p className="text-white font-medium">{method.displayName}</p>
                              <p className="text-white/60 text-sm">
                                {method.type === 'upi' ? 'UPI Payment' : 'Card Payment'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removePaymentMethod(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Payment Method Button */}
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 border-2 border-dashed border-white/30 rounded-xl text-white/70 hover:border-white/50 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Add Payment Method
                  </button>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <button
                      onClick={prevStep}
                      className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="px-6 py-3 bg-white text-indigo-900 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Skip Option */}
                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-white/60 hover:text-white/80 text-sm transition-colors"
                    >
                      Skip this step (you can add payment methods later)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Complete */}
            {currentStep === 4 && (
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Review Your Information</h2>
                  <p className="text-white/70">Confirm your details and create your account</p>
                </div>

                <div className="space-y-6">
                  {/* Account Summary */}
                  <div className="bg-white/10 border border-white/20 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Account Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-white/80">
                        <span>Name:</span>
                        <span className="text-white">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Email:</span>
                        <span className="text-white">{formData.email}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Phone:</span>
                        <span className="text-white">{formData.phone}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>ID Verification:</span>
                        <span className={verificationData.idType ? 'text-green-400' : 'text-yellow-400'}>
                          {verificationData.idType ? `${verificationData.idType.toUpperCase()} Added` : 'Not Verified'}
                        </span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Address Proof:</span>
                        <span className={verificationData.addressProofType ? 'text-green-400' : 'text-yellow-400'}>
                          {verificationData.addressProofType ? `${verificationData.addressProofType.toUpperCase()} Added` : 'Not Verified'}
                        </span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Payment Methods:</span>
                        <span className="text-white">{paymentMethods.length} added</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <form onSubmit={handleFinalSubmit}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Create Account & Get Started
                        </>
                      )}
                    </button>
                  </form>

                  {/* Back Button */}
                  <div className="text-center">
                    <button
                      onClick={prevStep}
                      className="text-white/60 hover:text-white/80 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Go back to edit information
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Payment Method</h3>
            
            <div className="space-y-6">
              {/* Payment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Payment Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentType('upi')}
                    className={`p-4 border-2 rounded-xl transition-all flex items-center gap-3 ${
                      paymentType === 'upi' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 text-blue-500" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">UPI Payment</p>
                      <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentType('card')}
                    className={`p-4 border-2 rounded-xl transition-all flex items-center gap-3 ${
                      paymentType === 'card' 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-green-500" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, Rupay</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* UPI Form */}
              {paymentType === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI Provider</label>
                    <select
                      value={upiProvider}
                      onChange={(e) => setUpiProvider(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select UPI Provider</option>
                      <option value="gpay">Google Pay</option>
                      <option value="phonepe">PhonePe</option>
                      <option value="paytm">Paytm</option>
                      <option value="bhim">BHIM</option>
                      <option value="amazonpay">Amazon Pay</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@ybl or 9876543210@ybl"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your UPI ID (e.g., yourname@ybl, 9876543210@ybl)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name (Optional)</label>
                    <input
                      type="text"
                      value={upiDisplayName}
                      onChange={(e) => setUpiDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">This name will be displayed when you select this payment method</p>
                  </div>
                </div>
              )}

              {/* Card Form */}
              {paymentType === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 16-digit card number</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">MM/YY format</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">3-4 digit code</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <select
                      value={cardBank}
                      onChange={(e) => setCardBank(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                      <option value="pnb">Punjab National Bank</option>
                      <option value="bob">Bank of Baroda</option>
                      <option value="canara">Canara Bank</option>
                      <option value="Union">Union Bank of India</option>
                      <option value="indian">Indian Bank</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    // Reset form
                    setPaymentType('upi');
                    setUpiProvider('');
                    setUpiId('');
                    setUpiDisplayName('');
                    setCardName('');
                    setCardNumber('');
                    setCardExpiry('');
                    setCardCvv('');
                    setCardBank('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (paymentType === 'upi') {
                      if (!upiProvider || !upiId) {
                        alert('Please fill in UPI provider and UPI ID');
                        return;
                      }
                      handlePaymentMethodSubmit({
                        type: 'upi',
                        provider: upiProvider,
                        upiId: upiId,
                        displayName: upiDisplayName || `${upiProvider.toUpperCase()} - ${upiId}`
                      });
                    } else {
                      if (!cardName || !cardNumber || !cardExpiry || !cardCvv || !cardBank) {
                        alert('Please fill in all card details');
                        return;
                      }
                      handlePaymentMethodSubmit({
                        type: 'card',
                        cardName: cardName,
                        cardNumber: cardNumber,
                        cardExpiry: cardExpiry,
                        cardBank: cardBank,
                        last4: cardNumber.slice(-4),
                        displayName: `${cardBank.toUpperCase()} •••• ${cardNumber.slice(-4)}`
                      });
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium"
                >
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCustomerSignup;

