# FitsToGo - Technical Specification

## 1. Executive Summary

FitsToGo is a virtual try-on marketplace platform that aggregates clothing products from affiliate programs (Lazada, Shopee) and enables users to visualize how clothes would look on them using AI-powered virtual try-on technology.

### Business Model
- **Primary Revenue**: Affiliate commissions from Lazada & Shopee
- **Secondary Revenue**: Monthly subscription plans for premium features

### Key Differentiator
AI-powered virtual try-on using Google Gemini Nano, allowing users to see how clothes fit before being redirected to purchase on partner platforms.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 + React 18 | Server-side rendering, SEO optimization |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS | Rapid UI development |
| Backend | Next.js API Routes | RESTful API endpoints |
| Database | MySQL 8.0 | Relational data storage |
| ORM | Prisma | Type-safe database queries |
| Authentication | NextAuth.js | OAuth + credentials auth |
| Payments | Stripe | Subscription management |
| AI/ML | Google Gemini Nano | Virtual try-on processing |
| File Storage | DigitalOcean Spaces (S3-compatible) | User photos, product images |
| Hosting | DigitalOcean App Platform | Deployment & scaling |
| Job Queue | BullMQ + Redis | Background product sync |
| Caching | Redis | API response caching |

---

## 3. Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0
- Redis (optional for dev)
- DigitalOcean Spaces account (for file storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/champkris/fitstogo.git
cd fitstogo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample data |
| `npm run sync:products` | Sync products from affiliates |

---

## 4. Project Structure

```
fitstogo/
├── docs/                    # Documentation
├── prisma/                  # Database schema
├── public/                  # Static assets
├── scripts/                 # Utility scripts
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   ├── (main)/         # Main app pages
│   │   └── api/            # API routes
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   ├── layout/         # Layout components
│   │   ├── products/       # Product components
│   │   ├── tryon/          # Try-on components
│   │   └── subscription/   # Subscription components
│   ├── lib/                 # Shared utilities
│   ├── services/            # Business logic
│   │   ├── affiliate/      # Lazada/Shopee integration
│   │   ├── tryon/          # Virtual try-on processing
│   │   └── sync/           # Product sync scheduler
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
├── .env.example            # Environment template
├── package.json
└── tsconfig.json
```

---

## 5. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth.js handler |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with filters |
| GET | `/api/products/:id` | Get product details |

### Photos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/photos` | List user's photos |
| POST | `/api/photos` | Upload new photo |
| DELETE | `/api/photos/:id` | Delete photo |
| PATCH | `/api/photos/:id` | Set as default |

### Try-On
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tryon` | Get try-on history |
| POST | `/api/tryon` | Create try-on session |
| GET | `/api/tryon/:id` | Get try-on result |

### Subscription
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription` | Get current subscription |
| POST | `/api/subscription/checkout` | Create Stripe checkout |
| POST | `/api/subscription/portal` | Get billing portal URL |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### Affiliate Redirect
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/redirect/:productId` | Track click & redirect |

---

## 6. Subscription Plans

| Feature | Free | Basic (฿99/mo) | Premium (฿299/mo) |
|---------|------|----------------|-------------------|
| Try-ons per month | 5 | 50 | Unlimited |
| Photo storage | 1 | 5 | 20 |
| History retention | 7 days | 30 days | Forever |
| Priority processing | No | No | Yes |

---

## 7. Development Phases

### Phase 1: MVP (Current)
- [x] Project setup & configuration
- [x] Database schema & migrations
- [x] User authentication
- [x] Product listing & search
- [x] User photo upload
- [x] Virtual try-on interface
- [x] Affiliate redirect & tracking
- [x] Stripe subscription integration

### Phase 2: Monetization
- [ ] Complete Stripe webhook handling
- [ ] Usage tracking & limits
- [ ] Payment history

### Phase 3: Chrome Extension
- [ ] Extension scaffold
- [ ] Product detection on Shopee/Lazada
- [ ] Sidebar UI
- [ ] Account sync

### Phase 4: Enhancement
- [ ] Advanced search & filters
- [ ] Recommendation engine
- [ ] Social sharing
- [ ] Wishlist/favorites

---

## 8. Environment Variables

See `.env.example` for all required environment variables.

---

*Document Version: 1.0*
*Last Updated: December 2024*
