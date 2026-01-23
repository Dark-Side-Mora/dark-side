# Authentication Flow Documentation

## Overview

This project uses **Supabase** for authentication and **NestJS** with **JWT** for securing backend APIs.

### Architecture Diagram

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
│                 │
│ 1. User logs in │
└────────┬────────┘
         │
         │ POST /auth/login
         │ (email, password)
         ↓
┌─────────────────────────────────────┐
│  Supabase Auth                      │
│                                     │
│ Returns:                            │
│  - access_token (JWT)               │
│  - refresh_token                    │
│  - user info                        │
└────────┬────────────────────────────┘
         │
         │ 2. Store session in
         │    AuthProvider context
         │
         ↓
┌──────────────────────────────────────┐
│  Frontend Storage                    │
│                                      │
│ - Session state (AuthContext)        │
│ - Token in memory (not localStorage) │
└──────────────────────────────────────┘
         │
         │ 3. Make API requests
         │    with token
         │
         ├─────────────────────────┐
         │                         │
         │ GET /auth/profile       │ POST /api/data
         │ Authorization: Bearer   │ Authorization: Bearer
         │ <token>                 │ <token>
         │                         │
         ↓                         ↓
┌─────────────────────────────────────┐
│  Backend (NestJS)                   │
│                                     │
│ 1. Extract token from header        │
│ 2. Get Supabase public key (JWKS)   │
│ 3. Verify JWT signature             │
│ 4. Check expiration                 │
│ 5. Extract user info from payload   │
│ 6. Sync user to database            │
│ 7. Attach user to request object    │
└────────┬────────────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│  Protected Route Handler     │
│                              │
│ @UseGuards(JwtAuthGuard)     │
│ @Get('profile')              │
│ getProfile(@Request() req) { │
│   // req.user is available   │
│ }                            │
└──────────────────────────────┘
```

## Frontend Setup

### 1. AuthProvider (Context)

Wrap your app with `AuthProvider` to manage session state:

```tsx
// app/layout.tsx
import { AuthProvider } from "@/lib/auth/auth-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 2. useAuthContext Hook

Access authentication state anywhere:

```tsx
import { useAuthContext } from "@/lib/auth/auth-context";

function MyComponent() {
  const { session, user, isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {user?.email}!</div>;
}
```

### 3. Making API Calls

Use the `apiGet`, `apiPost`, etc. helpers to automatically include the JWT token:

```tsx
import { apiGet, apiPost } from "@/lib/api/client";

// GET request
const profile = await apiGet<UserProfile>("/auth/profile");

// POST request
const result = await apiPost<any>("/api/data", {
  name: "John",
});

// The token is automatically attached to all requests
```

**Manual fetch with token:**

```tsx
import { fetchWithAuth } from "@/lib/api/client";

const response = await fetchWithAuth("/api/protected-route", {
  method: "POST",
  body: JSON.stringify({ data: "value" }),
});
```

## Backend Setup

### 1. Environment Variables

Add to `.env` or `.env.local`:

```env
# Supabase Configuration
SUPABASE_URL=https://ittbsprwnmijmyolibwh.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# Database
DATABASE_URL=your-database-url

# JWT (NestJS)
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600
```

### 2. Protect Routes with JWT Guard

```typescript
import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Controller("api")
export class DataController {
  @UseGuards(JwtAuthGuard)
  @Get("protected")
  getProtectedData(@Request() req) {
    // req.user contains:
    // {
    //   id: "user-id",
    //   email: "user@example.com",
    //   supabaseId: "supabase-uuid"
    // }
    return {
      message: "This is protected",
      userId: req.user.id,
    };
  }
}
```

### 3. JWT Strategy Details

The `JwtStrategy` automatically:

1. **Extracts the token** from the `Authorization: Bearer <token>` header
2. **Fetches Supabase's public keys** from `https://your-supabase-url/auth/v1/.well-known/jwks.json`
3. **Verifies the JWT signature** using ES256 algorithm
4. **Validates the token** hasn't expired
5. **Checks the audience** (must be "authenticated")
6. **Syncs the user** with your database using Prisma
7. **Returns the user object** attached to `req.user`

## Token Structure

Supabase JWT tokens contain:

```json
{
  "sub": "732b1203-6216-4e02-8da2-2295bc483562", // User ID
  "email": "user@example.com",
  "aud": "authenticated",
  "role": "authenticated",
  "iat": 1768969770, // Issued at
  "exp": 1768973370 // Expiration (1 hour later)
}
```

## Error Handling

### Expired Token

If a token expires:

1. Frontend receives 401 Unauthorized
2. `fetchWithAuth` automatically signs out the user
3. Redirect to login page

### Invalid Token

If the token is invalid:

1. Backend rejects with 401
2. User must log in again

## Database Sync

When a user authenticates:

```typescript
// In AuthService.getUserFromPayload()
const user = await this.prisma.user.upsert({
  where: { id: payload.sub }, // Supabase user ID
  update: {
    email: payload.email,
    updated_at: new Date(),
  },
  create: {
    id: payload.sub,
    email: payload.email,
  },
});
```

This ensures your database stays in sync with Supabase.

## Best Practices

1. **Never store tokens in localStorage** - Use memory/context (XSS safe)
2. **Always use HTTPS in production** - Prevent man-in-the-middle attacks
3. **Validate tokens on the backend** - Never trust the frontend
4. **Use short expiration times** - Refresh tokens as needed
5. **Implement refresh token rotation** - For security
6. **Log token validation errors** - For debugging
7. **Sync user data with database** - For offline access and auditing

## Testing Protected Routes

```bash
# 1. Get a token from your frontend login
# 2. In Postman/curl, add Authorization header:

curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3000/auth/profile
```

## Troubleshooting

### 401 Unauthorized

- Token might be expired
- Bearer token not in correct header format
- Token not from your Supabase instance

### 500 Error During Token Validation

- Supabase public keys couldn't be fetched
- Check `SUPABASE_URL` environment variable
- Verify network connectivity to Supabase

### User Not in Database

- First request might be slower (creating user)
- Check Prisma schema has User model
- Verify database connection

## Next Steps

1. Install dependencies: `npm install` in both apps
2. Run migrations: `npm run prisma:migrate`
3. Update your Prisma schema if needed
4. Test the flow: sign up → login → fetch protected data
