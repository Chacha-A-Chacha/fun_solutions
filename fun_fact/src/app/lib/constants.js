// Day definitions
export const DAYS = {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    FRIDAY: 'FRIDAY',
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
    [DAYS.FRIDAY]: 'Friday',
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
    [DAYS.FRIDAY]: [TIME_SLOTS.SLOT_8_10, TIME_SLOTS.SLOT_10_12, TIME_SLOTS.SLOT_13_15, TIME_SLOTS.SLOT_15_17],
    [DAYS.SATURDAY]: [TIME_SLOTS.SLOT_9_11, TIME_SLOTS.SLOT_11_13, TIME_SLOTS.SLOT_14_16, TIME_SLOTS.SLOT_16_18],
    [DAYS.SUNDAY]: [TIME_SLOTS.SLOT_9_11, TIME_SLOTS.SLOT_11_13, TIME_SLOTS.SLOT_14_16, TIME_SLOTS.SLOT_16_18]
  };
  
  // Kenyan NTSA driving licence classes (base classes only). Order matches the
  // Prisma `LicenceClass` enum. Used for student registration and the per-category
  // session capacity matrix.
  export const LICENCE_CLASSES = [
    'A1', 'A2', 'A3',
    'B1', 'B2', 'B3',
    'C1', 'C', 'CE', 'CD',
    'D1', 'D2', 'D3',
    'G'
  ];

  // Human-readable labels for each licence class
  export const LICENCE_CLASS_NAMES = {
    A1: 'A1 — Moped (up to 50cc)',
    A2: 'A2 — Motorcycle (above 50cc)',
    A3: 'A3 — Motorcycle taxi / three-wheeler',
    B1: 'B1 — Light vehicle',
    B2: 'B2 — Light vehicle (standard)',
    B3: 'B3 — Light vehicle (professional)',
    C1: 'C1 — Light truck',
    C:  'C — Medium truck',
    CE: 'CE — Medium truck with trailer',
    CD: 'CD — Hazardous materials transport',
    D1: 'D1 — Van (PSV)',
    D2: 'D2 — Minibus (PSV)',
    D3: 'D3 — Large bus (PSV)',
    G:  'G — Plant & machinery'
  };

  // Grouping for UI (selectors, capacity matrix tabs)
  export const LICENCE_CLASS_GROUPS = {
    A: ['A1', 'A2', 'A3'],
    B: ['B1', 'B2', 'B3'],
    C: ['C1', 'C', 'CE', 'CD'],
    D: ['D1', 'D2', 'D3'],
    G: ['G']
  };

  // Default licence class assigned to students until an admin sets the real one
  export const DEFAULT_LICENCE_CLASS = 'B2';

  // Session constraints (fallback defaults — DB SystemSetting takes precedence)
  export const SESSION_CONSTRAINTS = {
    MAX_CAPACITY: 4,
    MAX_DAYS_PER_STUDENT: 3,
    MAX_SESSIONS_PER_DAY: 1
  };

  // Error messages
  export const ERROR_MESSAGES = {
    SESSION_FULL: 'This session is already at full capacity.',
    MAX_DAYS_REACHED: 'You have reached the maximum days per week.',
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
  
