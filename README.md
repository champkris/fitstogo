# FitsToGo

Virtual Try-On Marketplace Platform - See how clothes look on you before you buy.

## Features

- Browse clothing products from Lazada and Shopee
- AI-powered virtual try-on using Google Gemini
- User photo management with privacy controls
- Subscription plans for premium features
- Affiliate tracking and commission earning

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Database**: MySQL + Prisma
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **Storage**: DigitalOcean Spaces
- **AI**: Google Gemini Nano

## Documentation

See [docs/technical-specification.md](docs/technical-specification.md) for detailed documentation.

## License

MIT
