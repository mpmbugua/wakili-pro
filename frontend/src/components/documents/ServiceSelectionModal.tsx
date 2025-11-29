import React, { useState } from 'react';
import { X, CheckCircle, Clock, Zap, AlertCircle } from 'lucide-react';

interface ServiceTier {
  id: 'AI_ONLY' | 'CERTIFICATION' | 'AI_PLUS_CERTIFICATION';
  name: string;
  description: string;
  price: number;
  features: string[];
  estimatedTime: string;
  recommended?: boolean;
}

interface UrgencyLevel {
  id: 'STANDARD' | 'URGENT' | 'EMERGENCY';
  name: string;
  multiplier: number;
  timeReduction: string;
  icon: React.ReactNode;
}

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  onConfirm: (selection: {
    serviceType: string;
    urgencyLevel: string;
    totalPrice: number;
  }) => void;
}

export const ServiceSelectionModal: React.FC<ServiceSelectionModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  onConfirm
}) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceTier | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | null>(null);

  const serviceTiers: ServiceTier[] = [
    {
      id: 'AI_ONLY',
      name: 'AI Review Only',
      description: 'Automated analysis of your document for potential issues',
      price: 5,
      features: [
        'AI-powered document analysis',
        'Issue detection and recommendations',
        'Grammar and formatting check',
        'Delivered in 2-4 hours'
      ],
      estimatedTime: '2-4 hours'
    },
    {
      id: 'CERTIFICATION',
      name: 'Lawyer Certification',
      description: 'Professional certification with lawyer signature and official stamp',
      price: 15,
      features: [
        'Licensed lawyer review',
        'Digital signature and stamp',
        'Certificate of Authenticity',
        'QR code verification',
        'Official letterhead'
      ],
      estimatedTime: '24-48 hours',
      recommended: true
    },
    {
      id: 'AI_PLUS_CERTIFICATION',
      name: 'AI + Certification',
      description: 'Complete package: AI analysis followed by lawyer certification',
      price: 18,
      features: [
        'All AI Review features',
        'All Certification features',
        'Pre-review issue detection',
        'Faster lawyer processing',
        'Best value package'
      ],
      estimatedTime: '24-48 hours'
    }
  ];

  const urgencyLevels: UrgencyLevel[] = [
    {
      id: 'STANDARD',
      name: 'Standard',
      multiplier: 1.0,
      timeReduction: 'Normal processing time',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'URGENT',
      name: 'Urgent',
      multiplier: 1.5,
      timeReduction: '50% faster',
      icon: <Zap className="h-5 w-5 text-orange-600" />
    },
    {
      id: 'EMERGENCY',
      name: 'Emergency',
      multiplier: 2.0,
      timeReduction: '2x faster',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />
    }
  ];

  const calculateTotal = () => {
    if (!selectedService || !selectedUrgency) return 0;
    return selectedService.price * selectedUrgency.multiplier;
  };

  const handleNext = () => {
    if (step === 1 && selectedService) {
      setStep(2);
    } else if (step === 2 && selectedUrgency) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = () => {
    if (selectedService && selectedUrgency) {
      onConfirm({
        serviceType: selectedService.id,
        urgencyLevel: selectedUrgency.id,
        totalPrice: calculateTotal()
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Request Document Review</h2>
            <p className="text-sm text-slate-600 mt-1">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= num
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {num}
                  </div>
                  <span className="text-xs mt-2 text-slate-600">
                    {num === 1 ? 'Service' : num === 2 ? 'Urgency' : 'Review'}
                  </span>
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      step > num ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Choose Your Service Type
              </h3>
              {serviceTiers.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                    selectedService?.id === service.id
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  } ${service.recommended ? 'relative' : ''}`}
                >
                  {service.recommended && (
                    <span className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-lg">
                      RECOMMENDED
                    </span>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-900 mb-1">
                        {service.name}
                      </h4>
                      <p className="text-sm text-slate-600">{service.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold text-blue-600">
                        ${service.price}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {service.estimatedTime}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Select Urgency */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Select Processing Speed
              </h3>
              {urgencyLevels.map((urgency) => (
                <button
                  key={urgency.id}
                  onClick={() => setSelectedUrgency(urgency)}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                    selectedUrgency?.id === urgency.id
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        urgency.id === 'STANDARD' ? 'bg-blue-100' :
                        urgency.id === 'URGENT' ? 'bg-orange-100' :
                        'bg-red-100'
                      }`}>
                        {urgency.icon}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">
                          {urgency.name}
                        </h4>
                        <p className="text-sm text-slate-600">{urgency.timeReduction}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {urgency.multiplier > 1 && (
                        <div className="text-2xl font-bold text-orange-600">
                          +{((urgency.multiplier - 1) * 100).toFixed(0)}%
                        </div>
                      )}
                      {urgency.multiplier === 1 && (
                        <div className="text-2xl font-bold text-green-600">
                          Free
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && selectedService && selectedUrgency && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Review Your Selection
              </h3>

              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Service Type</div>
                    <div className="font-semibold text-slate-900">{selectedService.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 mb-1">Base Price</div>
                    <div className="font-semibold text-slate-900">${selectedService.price.toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-start border-t border-slate-200 pt-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Processing Speed</div>
                    <div className="font-semibold text-slate-900">{selectedUrgency.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 mb-1">Multiplier</div>
                    <div className="font-semibold text-slate-900">×{selectedUrgency.multiplier}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t-2 border-slate-300 pt-4">
                  <div className="text-lg font-bold text-slate-900">Total Amount</div>
                  <div className="text-3xl font-bold text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 mb-1">
                      Estimated Delivery
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedService.estimatedTime}
                      {selectedUrgency.multiplier > 1 && ` (${selectedUrgency.timeReduction})`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-6 py-2.5 text-slate-700 hover:bg-slate-200 rounded-lg transition font-medium"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-3">
            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedService) ||
                  (step === 2 && !selectedUrgency)
                }
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition font-medium shadow-lg"
              >
                Continue
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleConfirm}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
              >
                Proceed to Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
