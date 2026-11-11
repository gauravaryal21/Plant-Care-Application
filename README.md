# Verdant — Plant Care Studio

Verdant helps you manage a plant collection, build recurring care schedules, and keep a searchable history of completed care. You can opt into device location for local weather and look up plants by common name to get a reviewed starter care profile.

## Getting started

1. Install a current Node.js release and npm.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and add your Supabase project URL and anon key.
4. Apply every SQL migration in `supabase/migrations/` to your Supabase project, in filename order.
5. Start the development server with `npm run dev`.

Supabase authentication must be enabled for email and password sign-in. The migrations enable row-level security and restrict plant, schedule, and history data to the signed-in account.

## Location and plant suggestions

Location access is opt-in. After permission is granted, coordinates are kept in the current browser only and sent to Open-Meteo to retrieve nearby weather; they are not stored in Supabase. Production deployments must use HTTPS for browser location access. The public Open-Meteo endpoint used here is for non-commercial use; configure a suitable licensed weather endpoint before commercial use.

Plant name search uses iNaturalist taxonomy. Only results with an image license are shown with an image, and attribution and license details are stored with the plant. Watering due dates use the saved interval as a baseline and adjust with the matched plant group and current local weather; outdoor locations can also account for forecast rain. Weather refreshes hourly while the app is open, and can be refreshed manually. These profiles are a starting point, not a guarantee: indoor light, pot size, soil and drainage can change care needs. Check the soil before watering.

## Project commands

- `npm run dev` — start the local development server.
- `npm run typecheck` — check the app's TypeScript types.
- `npm run lint` — check the source with ESLint.
- `npm run build` — create the production build in `dist/`.
- `npm run preview` — serve the production build locally.

Set the same two Supabase environment variables in your deployment environment before building. The generated `dist/` directory can be hosted on any static host that supports a single-page application fallback to `index.html`.
