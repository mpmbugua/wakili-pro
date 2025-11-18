import React from 'react';

export const LoyaltyPointsDisplay: React.FC<{ points: number }> = ({ points }) => (
  <div className="mt-2 text-green-700 font-semibold">Loyalty Points: {points}</div>
);
