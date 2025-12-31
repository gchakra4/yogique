# Technical Documentation

## Overview

This document provides a technical overview of the Class Assignment Manager application, including architecture, main modules, key files, configuration, and deployment.

## Architecture

- **Frontend:** React (TypeScript/JavaScript), modular feature-based structure.
- **Backend/Serverless:** Supabase functions for user and role management.
- **State Management:** React Context API and hooks.
- **Styling:** Tailwind CSS.
- **Build Tool:** Vite.

## Main Modules

- **Dashboard:** `src/features/dashboard/`
  - UniversalDashboard, modules, profile, hooks.
- **Analytics:** `src/features/analytics/`
  - DashboardMetrics, UserEngagementChart.
- **Auth:** `src/features/auth/`
  - AuthContext, ProtectedRoute, Login.
- **Instructor:** `src/features/instructor/`
  - Assignment management, earnings, protected routes.
- **Instructor Rates:** `src/features/instructor-rates/`
  - Rate forms, hooks, types.
- **Learning:** `src/features/learning/`
  - Articles, filters, rating, sharing.
- **Marketing:** `src/features/marketing/`
  - About, Achievements, Contact, Home.
- **Scheduling:** `src/features/scheduling/`
  - Schedule management (components, hooks, pages).
- **User Profile:** `src/features/user-profile/`
  - Profile hooks, pages.

## Shared Components & Utilities

- **Shared Components:** `src/shared/components/`
- **Config:** `src/shared/config/roleConfig.ts` (role definitions)
- **Contexts:** `src/shared/contexts/`
- **Lib:** `src/shared/lib/supabase.ts` (Supabase integration)
- **Types:** `src/shared/types/`
- **Utils:** `src/shared/utils/`

## Configuration

- **Environment:** Vite config (`vite.config.ts`), Tailwind (`tailwind.config.js`), TypeScript (`tsconfig.json`).
- **Supabase:** `supabase/config.toml`, serverless functions in `supabase/functions/`.

## Deployment

1. **Install dependencies:**  
   `npm install`
2. **Run development server:**  
   `npm run dev`
3. **Build for production:**  
   `npm run build`
4. **Deploy:**  
   Deploy the build output as per your hosting provider's instructions.

## Extension Points

- Add new features as modules under `src/features/`.
- Extend shared components for UI consistency.
- Add new Supabase functions for backend logic.

## References

- See `README.md` for project setup.
- See `CONTRIBUTING.md` for contribution guidelines.
- See `class-packages-info.md` for class/package structure.
