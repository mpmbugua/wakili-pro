import { getAppSetting } from '../services/appSettingService';

/**
 * Calculate the total amount for a booking, including emergency surcharge if applicable.
 * @param lawyerFee The lawyer's standard fee (number)
 * @param isEmergency Whether this is an emergency booking (boolean)
 * @returns {Promise<{ total: number, surcharge: number, commission: number, payout: number }>}
 */
export async function calculateBookingAmounts(lawyerFee: number, isEmergency: boolean): Promise<{ total: number, surcharge: number, commission: number, payout: number }> {
  // Get admin-configured values
  const surchargeStr = await getAppSetting('emergency_surcharge');
  const commissionStr = await getAppSetting('booking_commission_percent');
  const surcharge = isEmergency && surchargeStr ? parseFloat(surchargeStr) : 0;
  const commissionPercent = commissionStr ? parseFloat(commissionStr) : 30;

  // Commission is only on lawyer fee
  const commission = (lawyerFee * commissionPercent) / 100;
  const payout = lawyerFee - commission;
  const total = lawyerFee + surcharge;
  return { total, surcharge, commission, payout };
}
