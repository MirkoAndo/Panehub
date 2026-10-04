# Panehub

Panehub is a modern storefront web application built with [Next.js](https://nextjs.org), designed for showcasing and selling products.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Database / Auth**: [Supabase](https://supabase.com/)
- **Styling**: Tailwind CSS v4
- **Components**: [Shadcn UI](https://ui.shadcn.com/), Base UI, Lucide React
- **Language**: TypeScript

## Prerequisites

- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [pnpm](https://pnpm.io/) (Package manager used for this project)
- A [Supabase](https://supabase.com/) project to host your database

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Panehub.git
cd Panehub
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root of your project and add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Required for admin tasks
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

### 4. Database Schema Setup

You will need to set up the following tables in your Supabase project:

- **products**
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `price` (numeric)
  - `unit` (text)
  - `sale_method` (text)
  - `price_per_kg` (numeric)
  - `quantity_step` (numeric)
  - `image_url` (text)
  - `category_id` (uuid, foreign key to categories.id)
  - `active` (boolean)
  - `available` (boolean)
  - `created_at` (timestamp)

- **categories**
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text)
  - `active` (boolean)
  - `sort_order` (integer)

- **settings**
  - `id` (boolean, primary key - typically set to `true` for a single-row settings table)
  - `hero_image_url` (text)

### 5. Run the Development Server

Start the application in development mode:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: React components (including UI components like Shadcn).
- `lib/`: Utility functions and Supabase clients.

## Learn More

To learn more, take a look at the following resources:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

