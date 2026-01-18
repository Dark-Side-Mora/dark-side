# GitHub Integration - Environment Variables

## Required Environment Variables

Add the following variables to your `.env.local` or `.env` file:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/integrations/github/callback

# Encryption Key (32-byte hex string for AES-256)
ENCRYPTION_KEY=your_64_character_hex_string
```

## How to Get GitHub OAuth Credentials

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: http://localhost:3000 (or your domain)
   - **Authorization callback URL**: http://localhost:3000/integrations/github/callback
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

## How to Generate Encryption Key

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `ENCRYPTION_KEY`.

## Update Callback URL for Production

When deploying to production, update:

- `GITHUB_CALLBACK_URL` to your production domain
- Update the callback URL in your GitHub OAuth App settings
