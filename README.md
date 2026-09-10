# FitTrack

A responsive fitness workspace built with React 19 and Vite. Track workouts, food, water, steps, and personal goals from a shared dashboard.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. The welcome page offers **Sign in with Google** and **Explore demo**. Choosing the demo opens the sample profile; **Exit demo** returns to the welcome page. The demo choice survives refreshes in the current tab. Signed-in accounts always load their own Firebase records instead of sample data. **Make it yours** clears local sample records. Local mode saves changes in this browser and is separate from signed-in accounts. Use **Export data** to download a JSON backup (import is not implemented).

## Features

- Overview with daily targets, weekly activity, workout history, streaks, and hydration controls.
- Searchable workout library, custom routine creation/editing/deletion, exercise checklists, and an elapsed-time timer with pause/resume and a review step.
- 14 built-in routines with equipment details; combined category, difficulty, and duration filters; duration/name sorting; saved favorites; and last-completed dates. Search also matches equipment and exercises. Favorites use local storage in demo mode and the user's Firestore profile when signed in.
- Optional workout session notes appear in history. Custom workouts support difficulty, equipment, and instructions. Timed sessions retain the original routine ID for completion tracking.
- Manual workout logs with dates, duration, and user-entered activity calories.
- Food diary by date, meal categories, calories, and optional macros.
- Progress history and configurable daily and weekly targets.
- Responsive navigation, native modal focus handling, keyboard controls, reduced-motion support, form validation, save feedback, and deletion confirmations.
- Optional Google sign-in with existing Firebase user records. Sample data is never automatically uploaded.

## Firebase setup

Copy `.env.example` to `.env` and supply your Firebase web app values. Enable Google authentication and Firestore in your own Firebase project. Add the local or deployed hostname to Firebase Authentication's authorized domains. Configure Firestore rules so authenticated users can access only their own `users/{uid}` document and its subcollections. Never use open production rules.

Existing paths are preserved: `users/{uid}`, `workoutSessions`, `meals`, and `workouts`. Hydration and manual step values are date-keyed profile fields (`trackerWater` and `trackerSteps`). Account sync requires a working Firebase configuration and appropriate project permissions; production Google sign-in must be checked against your authorized domain.

If the dashboard reports `permission-denied`, inspect **Firestore Database → Rules** in Firebase Console. The included `firestore.rules` is an owner-only access template for these four paths, including the subcollections. It has not been deployed automatically or tested against your live project. Preserve rules for any unrelated collections when incorporating this template. Use the Firebase Rules Playground to check that a matching authenticated UID can access its own paths, while another UID and an unauthenticated user are denied. Publish the corrected rules, then click **Retry loading** in FitTrack. A missing profile or an empty collection alone does not cause a permission error.

## Validation

```sh
npm run lint
node --test tests/data.test.js
node tests/run-render-check.mjs
npm run build
```

Calculation tests cover Monday–Sunday week boundaries, date-scoped totals, duplicate-day streaks, and empty workspaces. Browser interaction tests and live Firebase sign-in are not part of this automated suite.

## Source guide

- `src/App.jsx`: app shell, routes, account controls, modal orchestration.
- `src/features/tracker/data.js`: workout library, sample records, progress calculations.
- `src/features/tracker/useTracker.js`: local storage and Firebase adapters.
- `src/features/tracker/components.jsx`: accessible forms, dialogs, workout session.
- `src/features/tracker/pages.jsx`: current app pages.
- `src/App.css`: shared design tokens and responsive styles.

Earlier page components remain in `src/pages` for reference and are not imported by the redesigned application. Existing dependencies and Firebase collections are retained.

## Assets

Hero photograph: [Jakub Balon on Unsplash](https://unsplash.com/photos/runners-legs-in-motion-on-a-track-MP38AUvIilY), available under the Unsplash License. The image is served by Unsplash. DM Sans and Manrope are loaded through Google Fonts with local sans-serif fallbacks. Lucide supplies interface icons. The app retains a usable solid-color banner if the image cannot load.

## Limitations

Steps and nutrition are manually entered; there is no wearable integration or automatic food database. Activity calories are not inferred from workout duration. Targets are user-selected preferences. Local browser storage is device-specific; clearing site data removes local entries. The deployed static app needs network access for Firebase, fonts, and the hero image.
