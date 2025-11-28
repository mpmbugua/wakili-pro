import cron from 'node-cron';
import EscrowService from '../services/escrowService';

/**
 * Scheduled Jobs for Consultation Booking System
 */
export class ScheduledJobs {
  /**
   * Auto-release escrow payments after 24 hours from session end
   * Runs every hour
   */
  static startAutoReleaseJob() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      console.log('🕐 [CRON] Running auto-release job...');
      try {
        const releasedCount = await EscrowService.autoReleaseExpiredBookings();
        console.log(`✅ [CRON] Auto-release job completed: ${releasedCount} payments released`);
      } catch (error) {
        console.error('❌ [CRON] Auto-release job failed:', error);
      }
    });

    console.log('✅ Auto-release job scheduled (runs hourly)');
  }

  /**
   * Send booking reminders 24 hours before sessions
   * Runs every 30 minutes
   */
  static startBookingReminderJob() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('📧 [CRON] Running booking reminder job...');
      try {
        // TODO: Implement reminder notifications (Phase 6)
        console.log('⏭️  [CRON] Reminder notifications - not yet implemented');
      } catch (error) {
        console.error('❌ [CRON] Booking reminder job failed:', error);
      }
    });

    console.log('✅ Booking reminder job scheduled (runs every 30 min)');
  }

  /**
   * Start all scheduled jobs
   */
  static startAll() {
    console.log('🚀 Starting scheduled jobs...');
    this.startAutoReleaseJob();
    this.startBookingReminderJob();
    console.log('✅ All scheduled jobs started');
  }
}

export default ScheduledJobs;
