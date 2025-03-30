import { format, addDays, startOfWeek } from 'date-fns';
import { DAYS, DAY_NAMES, TIME_SLOT_NAMES } from '../constants';

/**
 * Get a formatted string of the session time
 * @param {string} timeSlot - The time slot enum value
 * @returns {string} - Formatted time range
 */
export function formatTimeSlot(timeSlot) {
  return TIME_SLOT_NAMES[timeSlot] || 'Unknown Time';
}

/**
 * Get a formatted string of the day
 * @param {string} day - The day enum value
 * @returns {string} - Formatted day name
 */
export function formatDay(day) {
  return DAY_NAMES[day] || 'Unknown Day';
}

/**
 * Get a formatted string for a session (day and time)
 * @param {Object} session - The session object
 * @returns {string} - Formatted session string
 */
export function formatSession(session) {
  return `${formatDay(session.day)} ${formatTimeSlot(session.timeSlot)}`;
}

/**
 * Map day enumeration to JavaScript day of week (0-6, Sunday is 0)
 * @param {string} day - Day enum value
 * @returns {number} - JavaScript day of week
 */
export function mapDayToJsDay(day) {
  const mapping = {
    [DAYS.MONDAY]: 1,
    [DAYS.TUESDAY]: 2,
    [DAYS.WEDNESDAY]: 3,
    [DAYS.THURSDAY]: 4,
    [DAYS.FRIDAY]: 5,
    [DAYS.SATURDAY]: 6,
    [DAYS.SUNDAY]: 0
  };
  
  return mapping[day];
}

/**
 * Get the next date for a specific day
 * @param {string} day - Day enum value
 * @returns {Date} - The next date for that day
 */
export function getNextDateForDay(day) {
  const today = new Date();
  const dayOfWeek = mapDayToJsDay(day);
  
  const startOfCurrentWeek = startOfWeek(today);
  let targetDate = addDays(startOfCurrentWeek, dayOfWeek);
  
  // If the day has already passed this week, get next week's date
  if (targetDate < today) {
    targetDate = addDays(targetDate, 7);
  }
  
  return targetDate;
}

/**
 * Format a date object to a human-readable string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  return format(date, 'MMMM d, yyyy');
}
