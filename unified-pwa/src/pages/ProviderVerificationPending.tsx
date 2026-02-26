import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { providerService } from '../services/providerService';
import { 
  Mail, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ArrowLeft,
  Home,
  Shield
} from 'lucide-react';

const ProviderVerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    // Get email from location state or localStorage
    const savedEmail = location.state?.email || localStorage.getItem('providerEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.setItem('providerEmail', savedEmail);
    }
  }, [location.state]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const showMessage = (text: string, type: 'error' | 'success' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleResendVerification = async () => {
    if (!email || resendCountdown > 0) return;

    setIsLoading(true);
    try {
      await providerService.resendVerificationEmail(email);
      showMessage('✅ Verification email sent successfully!', 'success');
      setResendCountdown(60); // 60 seconds cooldown
    } catch (error: any) {
      showMessage(error.message || 'Failed to resend verification email', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-white/70">Check your inbox to activate your account</p>
          </div>

          {/* Email Display */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-white/60" />
              <div>
                <p className="text-white/60 text-sm">Email address</p>
                <p className="text-white font-medium">{email}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium">Check your inbox</p>
                <p className="text-white/60 text-xs">We've sent a verification link to your email</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium">Link expires in 24 hours</p>
                <p className="text-white/60 text-xs">Please verify within 24 hours</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium">Secure verification</p>
                <p className="text-white/60 text-xs">This ensures account security</p>
              </div>
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

          {/* Resend Button */}
          <div className="mb-6">
            <button
              onClick={handleResendVerification}
              disabled={!email || isLoading || resendCountdown > 0}
              className={`w-full px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                !email || isLoading || resendCountdown > 0
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : resendCountdown > 0 ? (
                <>
                  <Clock className="w-5 h-5" />
                  Resend in {resendCountdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend Verification Email
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go to Login
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              Didn't receive the email? Check your spam folder or contact support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderVerificationPending;
