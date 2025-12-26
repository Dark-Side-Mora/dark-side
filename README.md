# Dark Side - Turborepo Monorepo

A full-stack monorepo powered by Turborepo with NestJS backend and Next.js frontend.

## Project Structure

This monorepo contains the following applications and packages:

### Apps

- `api`: a [NestJS](https://nestjs.com/) backend API server
- `web`: a [Next.js](https://nextjs.org/) frontend application

### Packages

- `@repo/ui`: a React component library shared across applications
- `@repo/eslint-config`: ESLint configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: TypeScript configurations used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Tech Stack

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [NestJS](https://nestjs.com/) for the backend API
- [Next.js](https://nextjs.org/) for the frontend application

## Getting Started

### Prerequisites

Make sure you have Node.js installed (v18 or higher recommended).

### Installation

Install all dependencies from the root of the monorepo:

```sh
npm install
```

## Running the Applications

### Run All Apps in Development Mode

To run both the backend and frontend simultaneously:

```sh
npm run dev
```

This will start:

- **Backend API** (NestJS) at `http://localhost:3000`
- **Frontend** (Next.js) at `http://localhost:3001`

### Run Backend API Only

To run only the NestJS backend:

```sh
cd apps/api
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### Run Frontend Only

To run only the Next.js frontend:

```sh
cd apps/web
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Using Turborepo Filters

You can also use Turborepo to run specific apps:

```sh
# Run backend only
npx turbo dev --filter=api

# Run frontend only
npx turbo dev --filter=web
```

## Building for Production

### Build All Apps

```sh
npm run build
```

### Build Specific App

```sh
# Build backend
npx turbo build --filter=api

# Build frontend
npx turbo build --filter=web
```

## Project Structure Details

```
dark-side/
├── apps/
│   ├── api/          # NestJS backend API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── app.service.ts
│   │   └── test/
│   └── web/          # Next.js frontend
│       ├── app/
│       │   ├── layout.tsx
│       │   └── page.tsx
│       └── public/
├── packages/
│   ├── ui/           # Shared React components
│   ├── eslint-config/
│   └── typescript-config/
└── turbo.json
```

## Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
