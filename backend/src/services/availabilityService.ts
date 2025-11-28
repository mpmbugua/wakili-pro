import { PrismaClient } from '@prisma/client';
import { addDays, addMinutes, format, parse, isAfter, isBefore, isEqual, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface WorkingHours {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  wednesday: { start: string; end: string; available: boolean };
  thursday: { start: string; end: string; available: boolean };
  friday: { start: string; end: string; available: boolean };
  saturday: { start: string; end: string; available: boolean };
  sunday: { start: string; end: string; available: boolean };
}

interface BlockedSlot {
  id: string;
  start: Date;
  end: Date;
  reason?: string;
}

/**
 * Get available time slots for a lawyer on a specific date
 */
export const getAvailableSlots = async (
  lawyerId: string,
  date: Date,
  slotDuration: number = 60 // default 60 minutes
): Promise<TimeSlot[]> => {
  try {
    // Get lawyer profile with working hours and blocked slots
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: {
        workingHours: true,
        blockedSlots: true,
        available24_7: true,
      },
    });

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    // If lawyer is available 24/7, return all day slots
    if (lawyer.available24_7) {
      return generate24HourSlots(date, slotDuration, lawyer.blockedSlots as any);
    }

    // Parse working hours
    const workingHours = (lawyer.workingHours as unknown) as WorkingHours | null;
    if (!workingHours) {
      return []; // No working hours set
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof WorkingHours;

    const daySchedule = workingHours[dayName];

    // Check if lawyer is available on this day
    if (!daySchedule || !daySchedule.available) {
      return []; // Not available on this day
    }

    // Generate time slots for the day
    const slots = generateTimeSlots(
      date,
      daySchedule.start,
      daySchedule.end,
      slotDuration
    );

    // Filter out blocked slots
    const blockedSlots = (lawyer.blockedSlots as any[]) || [];
    const availableSlots = filterBlockedSlots(slots, blockedSlots);

    // Filter out past slots if date is today
    const now = new Date();
    if (format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      return availableSlots.filter(slot => isAfter(slot.start, now));
    }

    return availableSlots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
};

/**
 * Generate 24-hour time slots (for lawyers available 24/7)
 */
const generate24HourSlots = (
  date: Date,
  slotDuration: number,
  blockedSlots: any[]
): TimeSlot[] => {
  const slots = generateTimeSlots(date, '00:00', '23:59', slotDuration);
  return filterBlockedSlots(slots, blockedSlots || []);
};

/**
 * Generate time slots between start and end times
 */
const generateTimeSlots = (
  date: Date,
  startTime: string,
  endTime: string,
  slotDuration: number
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dateStr = format(date, 'yyyy-MM-dd');

  // Parse start and end times
  const startDateTime = parse(`${dateStr} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  const endDateTime = parse(`${dateStr} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

  let currentSlotStart = startDateTime;

  while (isBefore(currentSlotStart, endDateTime)) {
    const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);

    // Only add slot if it fits within working hours
    if (isBefore(currentSlotEnd, endDateTime) || isEqual(currentSlotEnd, endDateTime)) {
      slots.push({
        start: currentSlotStart,
        end: currentSlotEnd,
        available: true,
      });
    }

    currentSlotStart = currentSlotEnd;
  }

  return slots;
};

/**
 * Filter out slots that overlap with blocked times
 */
const filterBlockedSlots = (slots: TimeSlot[], blockedSlots: any[]): TimeSlot[] => {
  if (!blockedSlots || blockedSlots.length === 0) {
    return slots;
  }

  return slots.map(slot => {
    const isBlocked = blockedSlots.some((blocked: any) => {
      const blockedStart = new Date(blocked.start);
      const blockedEnd = new Date(blocked.end);

      // Check if slot overlaps with blocked time
      return (
        (isAfter(slot.start, blockedStart) || isEqual(slot.start, blockedStart)) &&
        isBefore(slot.start, blockedEnd)
      ) || (
        isAfter(slot.end, blockedStart) &&
        (isBefore(slot.end, blockedEnd) || isEqual(slot.end, blockedEnd))
      ) || (
        (isBefore(slot.start, blockedStart) || isEqual(slot.start, blockedStart)) &&
        (isAfter(slot.end, blockedEnd) || isEqual(slot.end, blockedEnd))
      );
    });

    return {
      ...slot,
      available: !isBlocked,
    };
  }).filter(slot => slot.available); // Only return available slots
};

/**
 * Block a time slot for a lawyer
 */
export const blockTimeSlot = async (
  lawyerId: string,
  start: Date,
  end: Date,
  reason?: string
): Promise<void> => {
  try {
    // Get current blocked slots
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { blockedSlots: true },
    });

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    const currentBlocked = (lawyer.blockedSlots as any[]) || [];

    // Add new blocked slot
    const newBlocked = [
      ...currentBlocked,
      {
        id: `blocked_${Date.now()}`,
        start: start.toISOString(),
        end: end.toISOString(),
        reason: reason || 'Unavailable',
        createdAt: new Date().toISOString(),
      },
    ];

    // Update lawyer profile
    await prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: { blockedSlots: newBlocked },
    });
  } catch (error) {
    console.error('Error blocking time slot:', error);
    throw error;
  }
};

/**
 * Unblock a time slot for a lawyer
 */
export const unblockTimeSlot = async (
  lawyerId: string,
  blockedSlotId: string
): Promise<void> => {
  try {
    // Get current blocked slots
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { blockedSlots: true },
    });

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    const currentBlocked = (lawyer.blockedSlots as any[]) || [];

    // Remove the blocked slot
    const updatedBlocked = currentBlocked.filter(
      (slot: any) => slot.id !== blockedSlotId
    );

    // Update lawyer profile
    await prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: { blockedSlots: updatedBlocked },
    });
  } catch (error) {
    console.error('Error unblocking time slot:', error);
    throw error;
  }
};

/**
 * Get all blocked slots for a lawyer
 */
export const getBlockedSlots = async (lawyerId: string): Promise<BlockedSlot[]> => {
  try {
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      select: { blockedSlots: true },
    });

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    const blockedSlots = (lawyer.blockedSlots as any[]) || [];

    return blockedSlots.map((slot: any) => ({
      id: slot.id,
      start: new Date(slot.start),
      end: new Date(slot.end),
      reason: slot.reason,
    }));
  } catch (error) {
    console.error('Error getting blocked slots:', error);
    throw error;
  }
};

/**
 * Get available slots for multiple days (useful for calendar view)
 */
export const getAvailableSlotsForRange = async (
  lawyerId: string,
  startDate: Date,
  endDate: Date,
  slotDuration: number = 60
): Promise<Record<string, TimeSlot[]>> => {
  try {
    const slots: Record<string, TimeSlot[]> = {};
    let currentDate = startOfDay(startDate);
    const lastDate = endOfDay(endDate);

    while (isBefore(currentDate, lastDate) || isEqual(currentDate, lastDate)) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      slots[dateKey] = await getAvailableSlots(lawyerId, currentDate, slotDuration);
      currentDate = addDays(currentDate, 1);
    }

    return slots;
  } catch (error) {
    console.error('Error getting available slots for range:', error);
    throw error;
  }
};
