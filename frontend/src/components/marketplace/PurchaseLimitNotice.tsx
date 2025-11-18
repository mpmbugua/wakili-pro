import React from 'react';

interface PurchaseLimitNoticeProps {
  used: number;
  limit: number;
  period: string;
}

export const PurchaseLimitNotice: React.FC<PurchaseLimitNoticeProps> = ({ used, limit, period }) => {
  const nearLimit = limit > 0 && used >= limit * 0.8 && used < limit;
  return (
    <div className="text-sm text-yellow-700 bg-yellow-100 rounded p-2 mt-2">
      {used >= limit ? (
        <span>You have reached your purchase limit ({limit}) for this {period}.</span>
      ) : nearLimit ? (
        <span>Warning: Only {limit - used} purchases remaining this {period}.</span>
      ) : (
        <span>{limit - used} purchases remaining this {period}.</span>
      )}
    </div>
  );
};
