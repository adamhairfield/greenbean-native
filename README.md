# 🌱 Greenbean

A React Native + Expo mobile application for local farm food delivery, built with Supabase backend.

## Features

### User Roles
- **Customer**: Browse and purchase local farm products, manage orders and deliveries
- **Driver**: View and manage delivery routes and orders
- **Admin**: Manage products, orders, and drivers
- **Master**: Full system access and configuration

### Core Functionality
- 🛒 Instacart-style shopping experience for local farm products
- 📦 Order management and tracking
- 🚚 Delivery scheduling (2x per week)
- 👤 Role-based access control
- 💳 Checkout and payment processing
- 📍 Address management
- ⭐ Favorites and shopping lists
- 📊 Admin analytics and reporting

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **UI**: React Native (custom components)
- **TypeScript**: Full type safety

## Project Structure

```
Greenbean/
├── src/
│   ├── contexts/          # React contexts (Auth, Cart)
│   ├── lib/              # Supabase client configuration
│   ├── navigation/       # Navigation setup
│   ├── screens/          # All app screens
│   │   ├── auth/        # Authentication screens
│   │   ├── shop/        # Shopping screens
│   │   ├── orders/      # Order management
│   │   ├── account/     # User account
│   │   ├── driver/      # Driver interface
│   │   └── admin/       # Admin dashboard
│   └── types/           # TypeScript type definitions
├── supabase/
│   └── schema.sql       # Database schema
├── scripts/             # Utility scripts
└── assets/             # Images and fonts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Supabase account

### 1. Install Dependencies

```bash
cd Greenbean
yarn install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL

3. Get your Supabase credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Project API keys → anon/public

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the App

```bash
# Start Expo development server
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android

# Run on web
yarn web
```

## Database Schema

The app uses the following main tables:

- **profiles**: User profiles with role-based access
- **products**: Farm products catalog
- **categories**: Product categories
- **orders**: Customer orders
- **order_items**: Individual items in orders
- **cart_items**: Shopping cart persistence
- **addresses**: Delivery addresses
- **delivery_schedules**: Delivery windows and scheduling
- **driver_assignments**: Driver-to-delivery mappings
- **notifications**: User notifications
- **favorites**: User favorite products

See `supabase/schema.sql` for complete schema with RLS policies.

## User Roles & Permissions

### Customer (Default)
- Browse products and categories
- Add items to cart
- Place orders
- Track deliveries
- Manage addresses
- View order history

### Driver
- View assigned deliveries
- Update delivery status
- Access delivery routes
- Mark orders as delivered

### Admin
- Manage products and inventory
- View all orders
- Assign drivers to deliveries
- Create delivery schedules
- View analytics

### Master
- All admin permissions
- Manage user roles
- System configuration
- Full database access

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Project setup and architecture
- [x] Authentication system
- [x] Database schema
- [x] Navigation structure
- [ ] Product browsing
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Order management

### Phase 2: Enhanced Features
- [ ] Driver app interface
- [ ] Admin dashboard
- [ ] Push notifications
- [ ] Payment integration
- [ ] Image uploads for products
- [ ] Search and filters

### Phase 3: Advanced Features
- [ ] Real-time order tracking
- [ ] Route optimization for drivers
- [ ] Analytics dashboard
- [ ] Promotional codes
- [ ] Subscription orders
- [ ] Rating and reviews

## API Integration

### Supabase Edge Functions

Create edge functions for:
- Order processing
- Payment handling
- Notification sending
- Delivery route optimization

Example:
```bash
supabase functions new process-order
```

## Testing

```bash
# Run tests (when implemented)
yarn test

# Type checking
yarn tsc --noEmit
```

## Deployment

### Mobile App

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Backend

Supabase handles backend deployment automatically. For edge functions:

```bash
supabase functions deploy function-name
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Contact: support@greenbean.app

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Backend by [Supabase](https://supabase.com)
- Icons from [Ionicons](https://ionic.io/ionicons)
