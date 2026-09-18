# Digital Exhibition & Competition Portal

A modern, event-driven web application designed to digitize school and college exhibitions and competitions from end to end — spanning science, robotics, IT, arts, cultural, dance, singing, sports, and innovation events.

## Project Purpose

Educational exhibitions and competitions often suffer from paper-heavy scoring sheets, manual calculation delays, and disorganized stall coordination. This platform streamlines:
- **Student Team Registration**: Dynamic roster submission, project abstracts, and tech stack information.
- **Mobile-First Evaluator Scoring**: Walk-around smartphone scoring using dynamic rubrics with mark boundary validation, peer privacy, and tamper-proof locking.
- **Administrative Studio**: Guarded 11-stage event lifecycle, custom criteria builder, stall allocation, and 1-click result publishing.
- **Visitor Engagement**: Printable stall QR passes enabling attendees to view project details and submit notes of encouragement.

---

## Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & ODM**: MongoDB with Mongoose (with cached connection management)
- **Icons**: Lucide React
- **Validation**: Zod (where applicable)
- **Formatting**: ESLint 9 & Prettier

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages and routes
│   │   ├── admin/              # Admin workspace placeholder
│   │   ├── evaluator/          # Evaluator workspace placeholder
│   │   ├── student/            # Student portal placeholder
│   │   ├── login/              # Authentication sign-in placeholder
│   │   ├── layout.tsx          # Root layout with ToastProvider
│   │   └── page.tsx            # Clean public landing page
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base atomic UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── loading-state.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   └── toast.tsx
│   │   └── navbar.tsx          # Responsive navigation system
│   ├── hooks/                  # Custom React hooks (e.g. useToast)
│   ├── lib/                    # Core libraries and database connection
│   │   └── mongodb.ts          # MongoDB/Mongoose connection manager
│   ├── models/                 # Mongoose schema models
│   ├── services/               # Data and business services
│   ├── types/                  # TypeScript interface definitions
│   └── utils/                  # Formatting and styling utilities (cn, formatDate)
├── .env.example                # Example environment variables
├── .env.local                  # Local development environment configuration
├── eslint.config.mjs           # ESLint 9 flat configuration
├── .prettierrc                 # Prettier formatting configuration
└── README.md                   # Project documentation
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# MongoDB Connection URI
MONGODB_URI=mongodb://127.0.0.1:27017/exhibition_portal

# Secret key for authentication token signing
AUTH_SECRET=your_auth_secret_key_here

# Public Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security Note:** Never commit secrets to source control. Use environment variables for all sensitive configuration.

---

## Installation

Ensure [Node.js](https://nodejs.org) (v18.18+ or v20+) is installed.

```bash
# Clone the repository
git clone <repository-url>
cd exhibition_evaluation

# Install dependencies
npm install
```

---

## Development Command

Run the local development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Build Command

Create an optimized production build:

```bash
npm run build
```

Run linting checks:

```bash
npm run lint
```

Start the production server:

```bash
npm run start
```
