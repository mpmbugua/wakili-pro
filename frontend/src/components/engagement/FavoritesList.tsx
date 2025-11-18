import React from 'react';

interface Favorite {
  targetType: string;
  targetId: string;
}
export const FavoritesList: React.FC<{ favorites: Favorite[] }> = ({ favorites }) => (
  <div className="mt-6">
    <h3 className="font-bold text-lg mb-2">Favorites</h3>
    <ul className="space-y-1">
      {favorites.map((fav, i) => (
        <li key={i}>{fav.targetType}: {fav.targetId}</li>
      ))}
    </ul>
  </div>
);
