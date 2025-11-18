import React from 'react';

interface Badge {
  type: string;
}
export const BadgeList: React.FC<{ badges: Badge[] }> = ({ badges }) => (
  <div className="mt-6">
    <h3 className="font-bold text-lg mb-2">Badges</h3>
    <ul className="flex gap-2 flex-wrap">
      {badges.map((badge, i) => (
        <li key={i} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">{badge.type}</li>
      ))}
    </ul>
  </div>
);
