import React from 'react';
import { useLawyerProfile } from '@/hooks/lawyerServices/useLawyerProfile';

export const LawyerProfileEditor: React.FC = () => {
  const { profile, updateProfile, isLoading } = useLawyerProfile();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Profile & Branding</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : profile ? (
        <form className="space-y-4">
          <div>
            <label className="block font-semibold">Name</label>
            <input className="border p-2 w-full" value={profile.name} readOnly />
          </div>
          <div>
            <label className="block font-semibold">Bio</label>
            <textarea className="border p-2 w-full" value={profile.bio} readOnly />
          </div>
          {/* Add more editable fields and update logic here */}
        </form>
      ) : (
        <div>No profile found.</div>
      )}
    </div>
  );
};
