import React from 'react';
import { FavoritesList } from '@/components/engagement/FavoritesList';
import { ReferralInvite } from '@/components/engagement/ReferralInvite';
import { LoyaltyPointsDisplay } from '@/components/engagement/LoyaltyPointsDisplay';
import { NotificationList } from '@/components/engagement/NotificationList';
import { BadgeList } from '@/components/engagement/BadgeList';
import { OnboardingProgressBar } from '@/components/engagement/OnboardingProgressBar';
import { AIChatHistory } from '@/components/engagement/AIChatHistory';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/hooks/engagement/useFavorites';
import { useReferrals, useCreateReferral } from '@/hooks/engagement/useReferrals';
import { useLoyaltyPoints } from '@/hooks/engagement/useLoyaltyPoints';
import { useNotifications, useMarkNotificationRead } from '@/hooks/engagement/useNotifications';
import { useBadges } from '@/hooks/engagement/useBadges';
import { useOnboardingProgress, useUpdateOnboardingProgress } from '@/hooks/engagement/useOnboardingProgress';
import { useAIChatHistory, useAddAIChatMessage } from '@/hooks/engagement/useAIChatHistory';

export const UserEngagementDashboard: React.FC = () => {
  const { data: favorites } = useFavorites();
  const { data: referrals } = useReferrals();
  const { data: loyalty } = useLoyaltyPoints();
  const { data: notifications } = useNotifications();
  const { data: badges } = useBadges();
  const { data: onboarding } = useOnboardingProgress();
  const { data: aiChats } = useAIChatHistory();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const createReferral = useCreateReferral();
  const markNotificationRead = useMarkNotificationRead();
  const updateOnboarding = useUpdateOnboardingProgress();
  const addAIChatMessage = useAddAIChatMessage();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Engagement & Rewards</h1>
      {onboarding && <OnboardingProgressBar step={onboarding.step} completed={onboarding.completed} />}
      {loyalty && <LoyaltyPointsDisplay points={loyalty.points} />}
      {badges && <BadgeList badges={badges} />}
      {favorites && <FavoritesList favorites={favorites} />}
      <ReferralInvite onInvite={email => createReferral.mutate({ refereeId: email })} />
      {notifications && <NotificationList notifications={notifications} onMarkRead={id => markNotificationRead.mutate(id)} />}
      {aiChats && <AIChatHistory chats={aiChats} />}
    </div>
  );
};

export default UserEngagementDashboard;
