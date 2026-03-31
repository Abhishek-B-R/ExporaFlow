# ExporaFlow Local Development Setup

This guide will help you set up ExporaFlow for local development.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18.17.0 or higher)
- **pnpm** (v9.14.2 or higher) - Package manager
- **PostgreSQL** (v14 or higher) - Database
- **Git** - Version control

### Recommended Tools
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
- **Postman** or **Insomnia** for API testing
- **Prisma Studio** for database management

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/exporaflow.git
cd exporaflow
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

### 4. Configure Environment Variables
Edit `.env` with your values:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/exporaflow"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Redis (for rate limiting)
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
UPSTASH_REDIS_REST_URL="your-upstash-url"

# Email (optional for development)
RESEND_API_KEY="your-resend-api-key"
```

### 5. Database Setup
```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma db push

# (Optional) Seed database with sample data
pnpm prisma db seed
```

### 6. Start Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Detailed Setup Instructions

### PostgreSQL Setup

#### Option 1: Local PostgreSQL
1. **Install PostgreSQL**:
   - **macOS**: `brew install postgresql`
   - **Ubuntu**: `sudo apt install postgresql postgresql-contrib`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Start PostgreSQL service**:
   ```bash
   # macOS
   brew services start postgresql
   
   # Ubuntu
   sudo systemctl start postgresql
   ```

3. **Create database**:
   ```bash
   createdb exporaflow
   ```

#### Option 2: Docker PostgreSQL
```bash
docker run --name exporaflow-postgres \
  -e POSTGRES_DB=exporaflow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14
```

#### Option 3: Cloud Database
Use services like:
- **Supabase** (recommended for beginners)
- **Railway**
- **PlanetScale**
- **Neon**

### OAuth Setup

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: ExporaFlow Local
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Redis Setup (Optional)

#### Option 1: Upstash (Recommended)
1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Copy REST URL and Token to `.env`

#### Option 2: Local Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

## 📁 Project Structure Overview

```
exporaflow/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes (RESTful endpoints)
│   │   ├── auth/          # NextAuth.js authentication
│   │   ├── issues/        # Issue management APIs
│   │   ├── user/          # User profile APIs
│   │   ├── waitlist/      # Email waitlist API
│   │   └── workflow/      # Project management APIs
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile pages
│   ├── workflow/          # Main application (dashboard)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/              # Auth-related components
│   ├── landing/           # Landing page components
│   ├── profilesection/    # Profile management
│   ├── ui/                # Reusable UI components
│   └── workflow/          # Dashboard components
├── lib/                   # Core utilities
│   ├── auth.ts            # NextAuth configuration
│   ├── auth-utils.ts      # Authorization helpers
│   ├── api-responses.ts   # Standardized API responses
│   ├── custom-toast.tsx   # Toast notification system
│   ├── icons.ts           # SVG icon definitions
│   ├── svg-icon.tsx       # SVG rendering component
│   └── validation-schemas.ts # Zod validation schemas
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── utils/                # Utility functions
│   ├── types.ts          # TypeScript type definitions
│   └── constants.ts      # Application constants
└── public/               # Static assets
    ├── assets/           # Images, icons
    └── banner/           # Banner images
```

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and profile data
- **Project**: Project management with status, priority, health
- **Issue**: Task/issue tracking within projects
- **Account/Session**: NextAuth.js authentication tables
- **WaitListEmails**: Pre-launch email collection

### Key Relationships
- User → Projects (creator, many-to-many members)
- Project → Issues (one-to-many)
- User → Issues (assignee)

## 🔌 API Architecture

### Authentication Pattern
```typescript
// All protected routes use this pattern
import { requireAuth } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const user = await requireAuth(); // Throws if not authenticated
  // Your logic here
}
```

### Authorization Pattern
```typescript
import { canAccessProject } from '@/lib/auth-utils';

const hasAccess = await canAccessProject(user.id, projectId);
if (!hasAccess) {
  return ApiResponses.forbidden();
}
```

### Validation Pattern
```typescript
import { validateRequestBody, createProjectSchema } from '@/lib/validation-schemas';

const validation = validateRequestBody(createProjectSchema, body);
if (!validation.success) {
  return ApiResponses.validationError(validation.errors);
}
```

## 🧪 Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm prisma studio    # Open Prisma Studio (database GUI)
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Push schema changes to database
pnpm prisma migrate dev # Create and apply migration

# Utilities
pnpm type-check       # Run TypeScript type checking
```

## 🐛 Common Issues & Solutions

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Reset database
pnpm prisma db push --force-reset
```

### OAuth Issues
- Ensure callback URLs match exactly
- Check that OAuth apps are not in development mode restrictions
- Verify environment variables are loaded correctly

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

## 🎯 Next Steps

1. **Explore the codebase** - Start with `app/page.tsx` and `app/workflow/page.tsx`
2. **Check out the API routes** - Look at `app/api/workflow/getprojects/route.ts`
3. **Understand the auth system** - Review `lib/auth-utils.ts`
4. **Try creating a project** - Test the full workflow
5. **Read the contributing guide** - See `CONTRIBUTING.md`

## 📞 Getting Help

- **GitHub Issues**: Report bugs or ask questions
- **Documentation**: Check `CONTRIBUTING.md` for development guidelines
- **Code Comments**: Most complex functions are well-documented

Happy coding! 🚀
