# GitHub App Setup Guide

## Step 1: Create a GitHub App

1. Go to **https://github.com/settings/apps** (or your organization settings)
2. Click **"New GitHub App"**

## Step 2: Configure Basic Information

```
GitHub App name: CI-Insights-App
Homepage URL: http://localhost:3001
Application description: CI/CD pipeline monitoring and security insights platform with repository-level access control.
```

## Step 3: Configure Callback URL

```
Callback URL: http://localhost:3000/integrations/github-app/callback
Setup URL (optional): http://localhost:3001/github-app-test
```

## Step 4: Configure Webhook (Optional but Recommended)

```
Webhook URL: http://localhost:3000/integrations/github-app/webhook
Webhook secret: (generate a random secret)

Active: ✅ Enabled
```

**Webhook Events** - Subscribe to:

- [x] Installation
- [x] Installation repositories

## Step 5: Set Permissions

### Repository permissions:

- **Contents**: Read-only (to read repository files)
- **Metadata**: Read-only (required, auto-selected)
- **Pull requests**: Read-only (if you need PR data)
- **Workflows**: Read-only (to access GitHub Actions)

### Organization permissions:

- **Members**: Read-only (to list organization members)

### Account permissions:

- None needed for basic setup

## Step 6: Where can this GitHub App be installed?

Select: **Any account** (or "Only on this account" for testing)

## Step 7: Create the App

Click **"Create GitHub App"**

## Step 8: Generate Private Key

1. After creation, scroll down to **"Private keys"** section
2. Click **"Generate a private key"**
3. Save the `.pem` file securely

## Step 9: Get App Credentials

You'll need these values:

```
App ID: (shown at top of settings page)
Client ID: (shown in "OAuth credentials" section)
Client Secret: Click "Generate a new client secret"
Private Key: The .pem file you downloaded
```

## Step 10: Update Environment Variables

Add to your `.env` file:

```env
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_APP_NAME=ci-insights-app
GITHUB_APP_CLIENT_ID=Iv1.abc123def456
GITHUB_APP_CLIENT_SECRET=your_client_secret_here
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...(paste entire key)...qwerty\n-----END RSA PRIVATE KEY-----"

# GitHub App URLs
GITHUB_APP_CALLBACK_URL=http://localhost:3000/integrations/github-app/callback
GITHUB_APP_WEBHOOK_SECRET=your_webhook_secret_here

# Encryption Key (keep existing)
ENCRYPTION_KEY=1dfd35a0519c81254da5c272d3eeab88eafe5f368c98745c0514e794368e0266
```

**Important**: For the private key, replace newlines with `\n` in the .env file, or keep it as a multi-line string.

## Step 11: Run Database Migration

```bash
cd apps/api
npx prisma migrate dev --name add-github-app-models
npx prisma generate
```

## Step 12: Test the Installation

1. Start backend: `cd apps/api && npm run dev`
2. Start frontend: `cd apps/web && npm run dev`
3. Go to: **http://localhost:3001/github-app-test**
4. Click "Install GitHub App"
5. Select repositories on GitHub
6. Get redirected back - see your repositories!

## Step 13: Verify in GitHub

Go to **https://github.com/settings/installations** to see:

- Which repositories CI-Insights-App has access to
- Add/remove repositories anytime
- Uninstall if needed

## Key Differences: GitHub App vs OAuth App

| Feature                  | OAuth App        | GitHub App         |
| ------------------------ | ---------------- | ------------------ |
| Visible in GitHub UI     | ❌ No            | ✅ Yes             |
| Repository selection     | In your app only | In GitHub settings |
| Rate limits              | 5,000/hour       | 15,000/hour        |
| Fine-grained permissions | ❌               | ✅                 |
| Installation-based       | ❌               | ✅                 |
| Webhooks                 | Manual setup     | Built-in           |

## Production Checklist

- [ ] Update callback URL to production domain
- [ ] Update webhook URL to production domain
- [ ] Store private key securely (environment variable or secret manager)
- [ ] Implement webhook signature verification
- [ ] Set up proper logging
- [ ] Handle installation suspension/deletion
- [ ] Add proper error handling for API rate limits

## Useful Links

- **App Settings**: https://github.com/settings/apps
- **Installations**: https://github.com/settings/installations
- **GitHub Apps Documentation**: https://docs.github.com/en/apps
- **Testing Webhooks**: Use ngrok for local development

---

🎉 **You're all set!** Your GitHub App now provides proper repository-level access control visible directly in GitHub's UI.
