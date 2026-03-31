# ExporaFlow Architecture Documentation

This document provides a comprehensive overview of ExporaFlow's technical architecture, design decisions, and implementation patterns.

## 🏗️ System Architecture

### High-Level Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React 19      │    │ • NextAuth.js   │    │ • Prisma ORM    │
│ • TypeScript    │    │ • Zod Validation│    │ • Relations     │
│ • Tailwind CSS  │    │ • Authorization │    │ • Migrations    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   External      │    │   Middleware    │    │   File System   │
│   Services      │    │                 │    │                 │
│                 │    │ • Auth Guards   │    │ • Static Assets │
│ • GitHub OAuth  │    │ • Rate Limiting │    │ • Uploads       │
│ • Google OAuth  │    │ • CORS          │    │ • Logs          │
│ • Upstash Redis │    │ • Validation    │    │                 │
│ • Resend Email  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Core Technologies

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.8
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks + Axios
- **Rich Text**: TipTap Editor
- **Animations**: Framer Motion
- **Icons**: Custom SVG system

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Authentication**: NextAuth.js v4
- **Database ORM**: Prisma 6.4
- **Validation**: Zod schemas
- **Rate Limiting**: Upstash Redis
- **Email**: Resend API

### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma with database sessions
- **Caching**: Redis (Upstash)
- **Migrations**: Prisma migrate

## 📊 Data Architecture

### Entity Relationship Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────►│   Project   │────►│    Issue    │
│             │     │             │     │             │
│ • id        │     │ • id        │     │ • id        │
│ • name      │     │ • title     │     │ • title     │
│ • email     │     │ • status    │     │ • status    │
│ • username  │     │ • priority  │     │ • priority  │
│ • image     │     │ • health    │     │ • assignee  │
└─────────────┘     │ • createdBy │     │ • projectId │
       │            │ • members[] │     └─────────────┘
       │            └─────────────┘            │
       │                   │                  │
       └───────────────────┼──────────────────┘
                          │
              ┌─────────────┐
              │ ProjectMember│
              │             │
              │ • userId    │
              │ • projectId │
              │ • role      │
              └─────────────┘
```

### Database Schema Details

#### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  username      String?   @unique
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
  createdProjects Project[] @relation("ProjectCreator")
  memberProjects  Project[] @relation("ProjectMembers")
  assignedIssues  Issue[]
}
```

#### Project Model
```prisma
model Project {
  id          String   @id @default(cuid())
  title       String   @unique
  description String?
  content     String?
  health      String   @default("Good")
  priority    String   @default("Medium")
  status      String   @default("Backlog")
  targetDate  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  createdBy   String
  creator     User     @relation("ProjectCreator", fields: [createdBy], references: [id], onDelete: Cascade)
  members     User[]   @relation("ProjectMembers")
  issues      Issue[]
}
```

#### Issue Model
```prisma
model Issue {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("Backlog")
  priority    String   @default("Medium")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  assignedUserId String?
  assignedUser   User?    @relation(fields: [assignedUserId], references: [id])
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

## 🔐 Authentication & Authorization

### Authentication Flow
```
1. User clicks "Sign in with GitHub/Google"
2. NextAuth.js redirects to OAuth provider
3. Provider redirects back with authorization code
4. NextAuth.js exchanges code for access token
5. User profile is fetched and stored in database
6. Session is created and stored in database
7. Session cookie is set in browser
```

### Authorization Layers

#### 1. Route-Level Protection
```typescript
// Client-side protection
<AuthGuard>
  <ProtectedComponent />
</AuthGuard>

// Server-side protection
const user = await requireAuth();
```

#### 2. Resource-Level Authorization
```typescript
// Project access control
const canAccess = await canAccessProject(userId, projectId);
const canModify = await canModifyProject(userId, projectId);

// Issue access control
const canAccess = await canAccessIssue(userId, issueId);
const canModify = await canModifyIssue(userId, issueId);
```

#### 3. API Endpoint Security
```typescript
export async function POST(request: NextRequest) {
  // 1. Authentication check
  const user = await requireAuth();
  
  // 2. Input validation
  const validation = validateRequestBody(schema, body);
  if (!validation.success) {
    return ApiResponses.validationError(validation.errors);
  }
  
  // 3. Authorization check
  const hasAccess = await canAccessResource(user.id, resourceId);
  if (!hasAccess) {
    return ApiResponses.forbidden();
  }
  
  // 4. Business logic
  // ...
}
```

## 🎨 Frontend Architecture

### Component Hierarchy
```
App Layout
├── Providers (Session, Theme)
├── Navbar (Landing pages)
├── AuthGuard (Protected routes)
│   ├── Workflow Layout
│   │   ├── Sidebar
│   │   ├── Main Content
│   │   └── Bottom Dock (Mobile)
│   └── Profile Layout
│       ├── Navbar
│       └── Profile Content
└── Toast Notifications
```

### State Management Patterns

#### 1. Server State (API Data)
```typescript
// Fetch pattern
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

#### 2. Client State (UI State)
```typescript
// Local component state
const [isOpen, setIsOpen] = useState(false);
const [selectedOption, setSelectedOption] = useState('default');

// Form state
const [formData, setFormData] = useState({
  title: '',
  description: '',
  priority: 'Medium'
});
```

#### 3. Authentication State
```typescript
// NextAuth session
const { data: session, status } = useSession();

// Auth guards
if (status === "loading") return <Loading />;
if (status === "unauthenticated") return <SignIn />;
```

### Component Patterns

#### 1. Compound Components
```typescript
<WorkflowLayout>
  <WorkflowLayout.Header>
    <TopTileButton />
  </WorkflowLayout.Header>
  <WorkflowLayout.Content>
    {children}
  </WorkflowLayout.Content>
</WorkflowLayout>
```

#### 2. Render Props
```typescript
<DataFetcher
  url="/api/projects"
  render={({ data, loading, error }) => (
    loading ? <Skeleton /> : <ProjectList projects={data} />
  )}
/>
```

#### 3. Custom Hooks
```typescript
const useProject = (projectId: string) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch logic, real-time updates, etc.
  
  return { project, loading, updateProject };
};
```

## 🔌 API Architecture

### RESTful Design Principles
```
GET    /api/workflow/getprojects     # List user's projects
POST   /api/workflow/createproject   # Create new project
GET    /api/workflow/project         # Get specific project
PATCH  /api/workflow/updateproject   # Update project
DELETE /api/workflow/deleteproject   # Delete project

POST   /api/issues/getissues         # Get project issues
POST   /api/issues/createissue       # Create new issue
PATCH  /api/issues/updateissue       # Update issue

GET    /api/user/getprofile          # Get user profile
PATCH  /api/user/updateprofile       # Update user profile
```

### Request/Response Patterns

#### Standard Request Format
```typescript
// POST/PATCH requests
{
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}

// Query parameters for GET requests
/api/resource?param1=value1&param2=value2
```

#### Standard Response Format
```typescript
// Success responses
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}

// Error responses
{
  "success": false,
  "error": "Error message",
  "details": { /* error details */ }
}
```

### Error Handling Strategy

#### 1. Client-Side Errors (4xx)
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (duplicate)
- `422 Unprocessable Entity`: Validation errors

#### 2. Server-Side Errors (5xx)
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: External service down

#### 3. Error Response Structure
```typescript
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "title",
    "message": "Title is required",
    "code": "REQUIRED_FIELD"
  }
}
```

## 🎯 Performance Considerations

### Frontend Optimizations
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: React.lazy for heavy components
- **Memoization**: React.memo for expensive renders

### Backend Optimizations
- **Database Queries**: Prisma query optimization
- **Caching**: Redis for session storage and rate limiting
- **Connection Pooling**: Prisma connection pooling
- **Response Compression**: Next.js automatic compression

### Database Optimizations
- **Indexes**: On frequently queried fields
- **Relations**: Proper foreign key constraints
- **Pagination**: Limit large result sets
- **Transactions**: For data consistency

## 🔄 Future Architecture Considerations

### Real-time Features
- **WebSockets**: For live collaboration
- **Server-Sent Events**: For notifications
- **Optimistic Updates**: For better UX

### Scalability
- **Microservices**: Split into smaller services
- **CDN**: For static asset delivery
- **Load Balancing**: For high availability
- **Database Sharding**: For large datasets

### Monitoring & Observability
- **Logging**: Structured logging with Winston
- **Metrics**: Application performance monitoring
- **Error Tracking**: Sentry integration
- **Health Checks**: Service health endpoints

This architecture provides a solid foundation for a modern, scalable project management application while maintaining simplicity and developer experience.
