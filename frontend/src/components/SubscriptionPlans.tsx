import React from 'react';

export interface SubscriptionPlan {
  plan: string;
  priceKES: number;
  label: string;
  duration: string;
}

export interface PaymentInfo {
  method: string;
  transactionId: string;
  amount: number;
  date: string;
}

export interface SubscriptionStatus {
  plan: string;
  status: string;
  priceKES: number;
  startDate: string;
  endDate: string;
  paymentInfo: PaymentInfo;
  cancelledAt?: string;
}

interface Props {
  plans: SubscriptionPlan[];
  status: SubscriptionStatus | null;
  isLoading: boolean;
  loadingPlans?: boolean;
  loadingStatus?: boolean;
  onSubscribe: (plan: string) => void;
  onCancel: () => void;
  onRenew: (plan: string) => void;
  premiumDisabled?: boolean;
}

import { FaCrown, FaCalendarAlt } from 'react-icons/fa';
const CrownIcon = FaCrown as React.ElementType;
const CalendarIcon = FaCalendarAlt as React.ElementType;

export const SubscriptionPlans: React.FC<Props> = ({ plans, status, isLoading, loadingPlans, loadingStatus, onSubscribe, onCancel, onRenew, premiumDisabled }) => {
  // Highlight yearly plan as best value
  const bestValuePlan = plans.find(p => p.plan === 'YEARLY');
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" id="plans-heading">
          <CrownIcon className="text-yellow-500" aria-hidden="true" />
          <span>Compare Plans</span>
        </h2>
  <div className="w-full flex flex-col md:flex-row gap-6 justify-center items-stretch" role="list" aria-labelledby="plans-heading">
          {loadingPlans ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex-1 border rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-md animate-pulse bg-gray-100 min-w-[220px] sm:min-w-[260px] max-w-xs mx-auto md:mx-0">
                <div className="h-8 w-32 bg-gray-300 rounded mb-4" />
                <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
                <div className="h-10 w-32 bg-gray-300 rounded mt-4" />
              </div>
            ))
          ) : plans.map(plan => {
            const isActive = status && status.status === 'ACTIVE' && status.plan === plan.plan;
            const isCancelled = status && status.status === 'CANCELLED' && status.plan === plan.plan;
            const isBest = bestValuePlan && plan.plan === bestValuePlan.plan;
            return (
              <div
                key={plan.plan}
                className={`flex-1 border-2 rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-lg min-w-[220px] sm:min-w-[260px] max-w-xs mx-auto md:mx-0 transition-all duration-300
                  ${isBest ? 'border-yellow-400 bg-yellow-50 scale-105 shadow-2xl' : 'border-gray-200 bg-white'}
                  ${isActive ? 'border-blue-600 bg-blue-50' : ''}`}
                role="listitem"
                aria-label={`${plan.label} plan${isBest ? ', best value' : ''}${isActive ? ', active' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CrownIcon className={`text-2xl ${isBest ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className="font-bold text-lg sm:text-2xl">{plan.label}</span>
                  {isBest && <span className="ml-2 px-2 py-1 bg-yellow-400 text-white text-xs rounded-full font-bold">Best Value</span>}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">KES {plan.priceKES.toLocaleString()}</div>
                <div className="text-gray-600 mb-2 text-sm sm:text-base">per {plan.duration}</div>
                <ul className="text-gray-500 text-xs sm:text-sm mb-4 space-y-1">
                  <li>{plan.plan === 'MONTHLY' ? 'Billed monthly, cancel anytime' : 'Save 5,989 KES/year vs monthly'}</li>
                  <li>{plan.plan === 'YEARLY' ? 'Priority support' : 'Standard support'}</li>
                </ul>
                <button
                  className={`mt-2 px-4 sm:px-6 py-2 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 w-full
                    ${isActive ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}
                    ${isLoading || premiumDisabled ? 'opacity-50' : ''}`}
                  disabled={!!isLoading || !!isActive || !!premiumDisabled}
                  onClick={() => onSubscribe(plan.plan)}
                  aria-disabled={!!isLoading || !!isActive || !!premiumDisabled}
                  aria-label={isActive ? `${plan.label} plan active` : premiumDisabled ? `${plan.label} plan unavailable` : `Subscribe to ${plan.label} plan`}
                >
                  {isLoading && !isActive ? <span className="animate-spin mr-2" aria-hidden="true">⏳</span> : null}
                  {isActive ? 'Active' : premiumDisabled ? 'Unavailable' : 'Subscribe'}
                </button>
                {isCancelled && (
                  <button
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 w-full"
                    disabled={isLoading || premiumDisabled}
                    aria-disabled={isLoading || premiumDisabled}
                    onClick={() => onRenew(plan.plan)}
                    aria-label={premiumDisabled ? `${plan.label} plan unavailable` : `Renew ${plan.label} plan`}
                  >{premiumDisabled ? 'Unavailable' : 'Renew'}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CalendarIcon className="text-blue-500" /> Current Subscription
        </h2>
        {loadingStatus ? (
          <div className="border rounded-xl p-6 bg-gray-100 shadow-md animate-pulse">
            <div className="h-6 w-32 bg-gray-300 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-40 bg-gray-200 rounded mt-4" />
          </div>
        ) : status ? (
          <div className="border rounded-xl p-6 bg-white shadow-md">
            <div className="mb-2"><b>Plan:</b> <span className="font-semibold">{status.plan}</span></div>
            <div className="mb-2"><b>Status:</b> <span className={`font-semibold ${status.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{status.status}</span></div>
            <div className="mb-2"><b>Start:</b> {new Date(status.startDate).toLocaleDateString()}</div>
            <div className="mb-2"><b>End:</b> {new Date(status.endDate).toLocaleDateString()}</div>
            {status.status === 'ACTIVE' && (
              <button
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                disabled={isLoading}
                onClick={onCancel}
              >{isLoading ? <span className="animate-spin mr-2">⏳</span> : null}Cancel Subscription</button>
            )}
            {status.status === 'CANCELLED' && status.cancelledAt && (
              <div className="text-red-500 mt-2">Cancelled at: {new Date(status.cancelledAt).toLocaleDateString()}</div>
            )}
            <div className="mt-4 text-gray-500 text-sm">For support, contact <a href="mailto:support@wakili.pro" className="underline text-blue-600">support@wakili.pro</a></div>
          </div>
        ) : (
          <div className="text-gray-500">No active subscription.</div>
        )}
      </div>
    </div>
  );
};
