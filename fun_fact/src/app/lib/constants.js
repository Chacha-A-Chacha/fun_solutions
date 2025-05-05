// Day definitions
export const DAYS = {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY'
  };
  
  // Time slot definitions
  export const TIME_SLOTS = {
    // Weekday slots (Monday-Thursday)
    SLOT_8_10: 'SLOT_8_10',   // 8-10am
    SLOT_10_12: 'SLOT_10_12', // 10am-12pm
    SLOT_13_15: 'SLOT_13_15', // 1-3pm
    SLOT_15_17: 'SLOT_15_17', // 3-5pm
    
    // Weekend slots (Saturday-Sunday)
    SLOT_9_11: 'SLOT_9_11',   // 9-11am
    SLOT_11_13: 'SLOT_11_13', // 11am-1pm
    SLOT_14_16: 'SLOT_14_16', // 2-4pm
    SLOT_16_18: 'SLOT_16_18'  // 4-6pm
  };
  
  // Human-readable day names
  export const DAY_NAMES = {
    [DAYS.MONDAY]: 'Monday',
    [DAYS.TUESDAY]: 'Tuesday',
    [DAYS.WEDNESDAY]: 'Wednesday',
    [DAYS.THURSDAY]: 'Thursday',
    [DAYS.SATURDAY]: 'Saturday',
    [DAYS.SUNDAY]: 'Sunday'
  };
  
  // Human-readable time slot names
  export const TIME_SLOT_NAMES = {
    // Weekday slots
    [TIME_SLOTS.SLOT_8_10]: '8:00 AM - 10:00 AM',
    [TIME_SLOTS.SLOT_10_12]: '10:00 AM - 12:00 PM',
    [TIME_SLOTS.SLOT_13_15]: '1:00 PM - 3:00 PM',
    [TIME_SLOTS.SLOT_15_17]: '3:00 PM - 5:00 PM',
    
    // Weekend slots
    [TIME_SLOTS.SLOT_9_11]: '9:00 AM - 11:00 AM',
    [TIME_SLOTS.SLOT_11_13]: '11:00 AM - 1:00 PM',
    [TIME_SLOTS.SLOT_14_16]: '2:00 PM - 4:00 PM',
    [TIME_SLOTS.SLOT_16_18]: '4:00 PM - 6:00 PM'
  };
  
  // Map days to their available time slots
  export const DAY_TIME_SLOTS = {
    [DAYS.MONDAY]: [TIME_SLOTS.SLOT_8_10, TIME_SLOTS.SLOT_10_12, TIME_SLOTS.SLOT_13_15, TIME_SLOTS.SLOT_15_17],
    [DAYS.TUESDAY]: [TIME_SLOTS.SLOT_8_10, TIME_SLOTS.SLOT_10_12, TIME_SLOTS.SLOT_13_15, TIME_SLOTS.SLOT_15_17],
    [DAYS.WEDNESDAY]: [TIME_SLOTS.SLOT_8_10, TIME_SLOTS.SLOT_10_12, TIME_SLOTS.SLOT_13_15, TIME_SLOTS.SLOT_15_17],
    [DAYS.THURSDAY]: [TIME_SLOTS.SLOT_8_10, TIME_SLOTS.SLOT_10_12, TIME_SLOTS.SLOT_13_15, TIME_SLOTS.SLOT_15_17],
    [DAYS.SATURDAY]: [TIME_SLOTS.SLOT_9_11, TIME_SLOTS.SLOT_11_13, TIME_SLOTS.SLOT_14_16, TIME_SLOTS.SLOT_16_18],
    [DAYS.SUNDAY]: [TIME_SLOTS.SLOT_9_11, TIME_SLOTS.SLOT_11_13, TIME_SLOTS.SLOT_14_16, TIME_SLOTS.SLOT_16_18]
  };
  
  // Session constraints
  export const SESSION_CONSTRAINTS = {
    MAX_CAPACITY: 6,
    MAX_DAYS_PER_STUDENT: 2,
    MAX_SESSIONS_PER_DAY: 1
  };
  
  // Error messages
  export const ERROR_MESSAGES = {
    SESSION_FULL: 'This session is already at full capacity.',
    MAX_DAYS_REACHED: 'You can only select up to 2 days.',
    DAY_ALREADY_BOOKED: 'You already have a session booked for this day.',
    INVALID_CREDENTIALS: 'Invalid student ID or email.',
    SYSTEM_ERROR: 'Something went wrong. Please try again later.',
    INVALID_SELECTION: 'Your selection does not meet the requirements.'
  };
  
  // Success messages
  export const SUCCESS_MESSAGES = {
    BOOKING_CREATED: 'Your session has been successfully booked!',
    BOOKING_CANCELLED: 'Your session booking has been cancelled.',
    LOGIN_SUCCESS: 'Login successful! You can now select your sessions.'
  };
  