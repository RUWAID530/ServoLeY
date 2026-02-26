import React, { useState, useEffect } from 'react';
import { escrowService, EscrowTransaction } from '../services/escrowService';
import { IndianRupee, Shield, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface EscrowPaymentProps {
  serviceId: string;
  providerId: string;
  customerId: string;
  amount: number;
  serviceName: string;
  onPaymentComplete?: (transaction: EscrowTransaction) => void;
  onPaymentFailed?: (error: string) => void;
}

const EscrowPayment: React.FC<EscrowPaymentProps> = ({
  serviceId,
  providerId,
  customerId,
  amount,
  serviceName,
  onPaymentComplete,
  onPaymentFailed
}) => {
  const [transaction, setTransaction] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'initiate' | 'processing' | 'held' | 'completed' | 'failed'>('initiate');
  const [error, setError] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const platformFee = amount * 0.05; // 5% platform fee
  const totalAmount = amount + platformFee;

  // Initialize escrow transaction
  const initiateEscrowPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentStep('processing');

      // Create escrow transaction
      const escrowTransaction = await escrowService.createEscrowTransaction(
        customerId,
        providerId,
        amount,
        serviceId
      );

      setTransaction(escrowTransaction);

      // Simulate UPI payment processing
      setTimeout(async () => {
        try {
          // Hold payment in escrow after successful UPI payment
          await escrowService.holdPayment(escrowTransaction.id);
          setPaymentStep('held');
          onPaymentComplete?.(escrowTransaction);
        } catch (err) {
          setError('Payment failed. Please try again.');
          setPaymentStep('failed');
          onPaymentFailed?.('Payment processing failed');
        } finally {
          setLoading(false);
        }
      }, 3000); // Simulate 3-second payment processing

    } catch (err) {
      setError('Failed to initiate payment. Please try again.');
      setPaymentStep('failed');
      setLoading(false);
      onPaymentFailed?.('Payment initiation failed');
    }
  };

  // Release payment to provider
  const releasePayment = async () => {
    if (!transaction) return;

    try {
      setLoading(true);
      await escrowService.releasePayment(transaction.id);
      setPaymentStep('completed');
      setTransaction({ ...transaction, status: 'released', releasedAt: new Date() });
    } catch (err) {
      setError('Failed to release payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Initiate dispute
  const initiateDispute = async () => {
    if (!transaction || !disputeReason.trim()) return;

    try {
      setLoading(true);
      await escrowService.initiateDispute(transaction.id, disputeReason, 'customer');
      setShowDisputeModal(false);
      setTransaction({ ...transaction, status: 'disputed', disputeReason });
      setDisputeReason('');
    } catch (err) {
      setError('Failed to initiate dispute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Request refund
  const requestRefund = async () => {
    if (!transaction) return;

    try {
      setLoading(true);
      await escrowService.refundPayment(transaction.id, amount, 'Customer requested refund');
      setTransaction({ ...transaction, status: 'refunded' });
    } catch (err) {
      setError('Failed to process refund. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = () => {
    switch (paymentStep) {
      case 'initiate':
        return <Shield className="w-6 h-6 text-blue-500" />;
      case 'processing':
        return <Clock className="w-6 h-6 text-yellow-500 animate-spin" />;
      case 'held':
        return <Shield className="w-6 h-6 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Shield className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStepTitle = () => {
    switch (paymentStep) {
      case 'initiate':
        return 'Secure Payment Initiated';
      case 'processing':
        return 'Processing Payment...';
      case 'held':
        return 'Payment Secured in Escrow';
      case 'completed':
        return 'Payment Released to Provider';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Payment Status';
    }
  };

  const getStepDescription = () => {
    switch (paymentStep) {
      case 'initiate':
        return 'Your payment will be held securely until service completion';
      case 'processing':
        return 'Please complete your UPI payment...';
      case 'held':
        return `₹${amount} is held securely. Release after service completion`;
      case 'completed':
        return `Payment of ₹${amount} has been released to the provider`;
      case 'failed':
        return 'Payment could not be processed. Please try again';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStepIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h3>
            <p className="text-sm text-gray-600">{getStepDescription()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Service</p>
          <p className="font-medium text-gray-900">{serviceName}</p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Payment Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Amount</span>
            <span className="font-medium">₹{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee (5%)</span>
            <span className="font-medium">₹{platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Escrow Protection</span>
            <span className="font-medium text-green-600">✓ Free</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {paymentStep === 'initiate' && (
          <button
            onClick={initiateEscrowPayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <IndianRupee className="w-5 h-5" />
            {loading ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)} via UPI`}
          </button>
        )}

        {paymentStep === 'processing' && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Processing payment...</span>
            </div>
          </div>
        )}

        {paymentStep === 'held' && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Payment Secured</span>
              </div>
              <p className="text-sm text-green-700">
                ₹{amount} is held in escrow until you confirm service completion
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={releasePayment}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Release Payment'}
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
              >
                Raise Dispute
              </button>
            </div>
          </div>
        )}

        {paymentStep === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Payment Completed Successfully</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              ₹{amount} has been released to the service provider
            </p>
          </div>
        )}

        {paymentStep === 'failed' && (
          <button
            onClick={initiateEscrowPayment}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Raise Dispute</h3>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Please describe the issue with the service..."
              className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={initiateDispute}
                disabled={!disputeReason.trim() || loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>Escrow Protected</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            <span>Dispute Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowPayment;
