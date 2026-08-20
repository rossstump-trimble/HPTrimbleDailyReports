# ProjectSight Web Prototype

A modern web application built with Next.js 14, featuring real-time collaboration, project management, and advanced UI components. This project showcases the next generation of construction project management tools.

## Features

- 🎨 Modern UI with dark/light theme support using shadcn/ui
- 🎥 Real-time audio/video streaming with Google's Multimodal Live API
- 🖥️ Screen sharing and webcam integration
- 🗺️ Interactive map view with Google Maps integration
- 📊 Advanced data visualization with Recharts
- 🔍 Powerful search and filtering capabilities
- 📱 Design with Tailwind CSS
- 🤖 AI-powered assistance with Gemini Flash integration and optimized Assistant Panel
- 📸 Robust screen capture with annotation tools
- 🌐 3D visualization with Three.js

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **Media Streaming**:
  - Google Multimodal Live API
  - WebRTC for media capture
  - Canvas API for frame processing
- **UI Components**:
  - Radix UI primitives
  - shadcn/ui component system
  - Custom components
  - Lucide React / Connect icons
- **State Management**:
  - Zustand for global state
  - React Hook Form for forms
- **Data & Backend**:
  - Supabase for database
  - AI integration (Gemini)
- **Visualization**:
  - Three.js for 3D
  - Recharts for charts
  - Google Maps API
- **File Handling**:
  - PDF viewing (react-pdf)

## Getting Started

1. Clone the repository:

```bash
git clone [repository-url]
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables:
   Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Reach out to Julian Oczkowski if you need help


```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable UI components
  - `ui/` - Base UI components
  - Feature-specific component directories
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and shared logic
- `config/` - Configuration files
- `types/` - TypeScript type definitions
- `public/` - Static assets

## Development

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Husky for git hooks
- Proper error boundaries

### Performance

- Optimized builds with webpack
- Code splitting
- Image optimization
- Font optimization

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives)

## Deployment

The application is designed to be deployed on Vercel. Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
