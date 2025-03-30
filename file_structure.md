fun_fact/
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── route.js          # API for student authentication
│   │   │   ├── sessions/
│   │   │   │   └── route.js          # API for session management
│   │   │   └── bookings/
│   │   │       └── route.js          # API for booking management
│   │   ├── dashboard/
│   │   │   └── page.js               # Session selection dashboard
│   │   ├── layout.js                 # Root layout
│   │   └── page.js                   # Login page
│   ├── components/
│   │   ├── AuthForm.js               # Student authentication form
│   │   ├── SessionSelector.js        # Component for selecting sessions
│   │   ├── SelectedSessions.js       # Shows selected sessions
│   │   ├── SessionCalendar.js        # Calendar view of sessions
│   │   └── SessionCard.js            # Individual session display
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.js             # Database schema definition
│   │   │   ├── migrations/           # Database migrations
│   │   │   └── index.js              # Database connection setup
│   │   ├── utils/
│   │   │   ├── auth.js               # Authentication utilities
│   │   │   ├── validation.js         # Form validation functions
│   │   │   └── dates.js              # Date handling utilities
│   │   └── constants.js              # App constants (session times, etc.)
│   ├── hooks/
│   │   ├── useAuth.js                # Custom hook for authentication
│   │   ├── useSessions.js            # Custom hook for session data
│   │   └── useBookings.js            # Custom hook for booking management
│   └── styles/
│       └── globals.css               # Global styles
├── prisma/                           # We'll use Prisma with SQLite
│   └── schema.prisma                 # Prisma schema for SQLite
├── .env.local                        # Environment variables
├── .gitignore                        # Git ignore file
├── next.config.js                    # Next.js configuration
├── package.json                      # Project dependencies
└── README.md                         # Project documentation