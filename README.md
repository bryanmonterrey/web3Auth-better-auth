# Next.js 16 + Solana + Better Auth Starter

A powerful, production-ready starter template for Next.js 16 projects, featuring robust Web3 authentication and a modern tech stack.

## 🚀 Key Features

### 🔐 Advanced Authentication
- **Solana Integration (SIWS)**: Secure "Sign In With Solana" using the official standard. Authenticate users via their Phantom, Solflare, or other Solana wallets.
- **Passkey Support**: Biometric authentication (FaceID, TouchID) for a seamless and secure login experience.
- **Account Linking**: Link multiple authentication methods (Wallet, Google, Twitter, Discord, Twitch) to a single user identity.
- **Better Auth**: Powered by the latest `better-auth` library for flexible and secure auth flows.

### 🛠️ Modern Tech Stack
- **Next.js 16**: The latest React framework with Turbopack, Server Actions, and App Router.
- **tRPC**: End-to-end type-safe APIs for seamless client-server communication.
- **React Query**: Powerful asynchronous state management and data fetching.
- **Drizzle ORM**: Lightweight and type-safe TypeScript ORM.
- **Supabase**: Scalable PostgreSQL database backend.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.

## Getting Started

Follow these steps to set up the project:

### 1. Clone the Repository

```bash
git clone https://github.com/bryanmonterrey/web3Auth-better-auth.git
cd nextjs-better-auth
```

### 2. Install Dependencies

Make sure you have [Bun](https://bun.sh/) installed, then run:

```bash
bun install
```

### 3. Configure Environment Variables

Copy the `env.example` file to create your `.env` file:

```bash
cp env.example .env
```

Edit the `.env` file with your project's specific configurations:
- **Supabase**: Add your database URL and keys.
- **Better Auth**: Set your `BETTER_AUTH_SECRET` and `NEXT_PUBLIC_AUTH_URL`.
- **Social Providers**: Add Client IDs and Secrets for Google, Twitter, etc.
- **Solana**: Configure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` for wallet support.

### 4. Setup Database

Generate your Drizzle schema and push it to your database:

```bash
# Generate auth schema
bunx @better-auth/cli@latest generate --config ./src/lib/auth/server.ts

# Push schema to DB
bunx drizzle-kit push
```

### 5. Start the Development Server

Run the development server with Turbopack:

```bash
bun dev
```

Your application will be available at [http://localhost:3001](http://localhost:3001).

## Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests.
- Submit pull requests to improve the project.

### License

This project is licensed under the MIT License.
