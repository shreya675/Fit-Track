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
- Every exercise carries artwork: a thumbnail beside each checklist line, an expandable "How to" panel with start/finish frames and written form cues, a preview on each workout card, and one on each recommendation. Photographs are used for the 42 exercises the free-exercise-db dataset covers; the remaining 25 use drawings made for this app.
- Log the weight and repetitions of each set during a session, with a one-tap repeat of what you did last time. Sessions store those sets, so personal records and per-exercise progress build up as you train.
- Body weight readings with a trend chart and the change over the last 30 days, kept separate from the single figure in your profile.
- Optional workout session notes appear in history. Custom workouts support difficulty, equipment, and instructions. Timed sessions retain the original routine ID for completion tracking.
- Manual workout logs with dates and duration. Activity calories are estimated from the duration, the exercises done and your body weight, and can be typed over.
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

### Exercise recommendations

The Workouts page suggests three of 63 curated exercises. Each has its own vector across eight equally scaled content dimensions — strength, cardio, mobility, upper body, lower body, core, impact and equipment involvement — plus a demand level of 1 to 3. These are curated descriptors and an ease-of-entry label, not calibrated fitness or safety scores and not an assessment of anyone's ability; nothing here is a training prescription.

Sessions from the last twelve weeks are weighted towards the present, halving in influence every fortnight. Their exercises are averaged into a profile of what you have actually been doing, and each candidate is then scored on four things: how much it fills the part of your own mix that has had the least attention (the largest term), how long since you last did it, whether you have used its equipment before, and how close it stays to your usual training. An exercise done in the last two days is set aside, no more than two suggestions share a category, and a large jump in impact is damped so a gentle routine is not handed burpees. Every card states the reason it was chosen.

Three things you tell us are respected. **Equipment** ticked in your profile is a limit: nothing outside it is suggested, and leaving it empty falls back to inferring from what you have logged. **What you are working towards** leans the ranking towards strength, cardio or mobility; "A balanced mix" adds a constant and so changes nothing. **Activity level** sets how demanding a movement may be before it is held back — someone just getting started is not handed burpees or pike push-ups, though anything they have already done raises that ceiling regardless of what they selected. Exercises dismissed with the × on a card still count as history but are never suggested again until restored.

Two exercises whose vectors are more than 0.985 alike are never shown together, so biceps curl and hammer curl cannot fill two of the three slots.

This replaced a pure cosine-similarity ranking over ten shared group vectors, which recommended what you already did — a history of nothing but walking was answered with three kinds of walking, a bodyweight circuit logged yesterday was answered with two of its own exercises, and the top candidates were usually tied to four decimal places.

Each session contributes equally regardless of length. Exercise IDs, exact names, aliases, and linked routine exercises resolve detailed history; older category-only entries use the category's average vector. Future and undated records are excluded. Ties use stable exercise IDs. New users see a prompt to log a workout, and sample history is explicitly labeled. New routine completions store checked exercise snapshots so later routine edits or deletion cannot rewrite that history. Logging a suggestion opens the existing review form and uses the existing local/Firebase session storage.

Run `node --test tests/data.test.js tests/recommendations.test.js` for calculations and ranking checks, and `node tests/run-render-check.mjs` for page and recommendation-state rendering checks.

### Activity calories

`calories.js` estimates the energy cost of a session with the standard metabolic equivalent formula, `kcal/min = MET × 3.5 × kg / 200`. The MET is the average across the exercises actually ticked (one value per illustration slug, at moderate effort, following the published Compendium of Physical Activities), falling back to the workout's category. Body weight comes from the most recent logged reading, then the profile figure; with neither, no estimate is offered rather than one being invented from a default body. The field stays editable and stops following the estimate the moment it is typed into.

These are population averages, not measurements, and the form says so. Run `node --test tests/calories.test.js`.

### Strength logging and progress

A session records `entries`: one row per exercise with `{ slug, name, sets: [{ weight, reps }] }`. A set counts once it has repetitions, so bodyweight work is logged with the weight left blank and simply adds no tonnage. The existing `exercises` array of checked lines is still written, so older sessions and the recommendation engine are unaffected.

`progressStats.js` derives everything else and holds no React or Firebase, so it can be tested directly: `bestSet` (heaviest, repetitions breaking ties), `exerciseLog` (one row per exercise, newest session first), `personalRecords`, `lastSetsFor` (the repeat prompt), and the body-weight helpers `weightSeries`, `latestWeight` and `weightChange`. An exercise saved with a slug in one session and only a name in another is treated as the same exercise.

Body weight lives in its own `measurements` collection — `users/{uid}/measurements` in Firestore, or the same local blob — rather than overwriting the profile figure, so a history is kept. **Any new subcollection needs a matching rule in `firestore.rules`**, which now covers `measurements`; without one, Firestore denies reads and writes and the panel silently stays empty.

Run `node --test tests/progressStats.test.js` for the set, record and weight calculations.

### Exercise artwork

Two sources, in order of preference.

**Photographs.** 42 exercises are matched to demonstration photographs in [free-exercise-db](https://github.com/yuhonas/free-exercise-db), the dataset `exercise-source.json` was taken from. They are requested from jsDelivr at runtime rather than committed, so the repository stays small: `PHOTO_BASE` in `exerciseArtMatch.js` is the only place the URL is built, and pointing it at a local folder serves them yourself instead. Each exercise lists its frames in order, so the how-to panel can label them Start and Finish. **Check the licence before shipping publicly** — the dataset is released under the Unlicense but the photographs originate elsewhere, and that provenance has not been confirmed here.

**Drawings.** The 25 exercises the dataset does not cover — the gentle at-home movements such as march in place, wall push-up, wall sit, bird dog, heel digs, and the warm-up and cool-down entries — keep a flat SVG in `public/images/exercises/<slug>.svg`, drawn in the app's palette. Two-position movements show the starting position as a lighter figure behind the finishing one with an arrow for direction of travel; held positions show a single figure. Every exercise has one, so a drawing is also the fallback if a photograph fails to load.

`src/features/tracker/exerciseArtData.js` holds the slug, display name, and four form cues per exercise. `exerciseArtMatch.js` resolves a plan line such as `Bodyweight squat · 2 × 10` onto a slug by exact name, a table of alternative wordings, then a longest-name substring match, so custom routines that reuse familiar exercise names are illustrated too. Anything unrecognised renders without an image rather than guessing, and `findPlanArt` picks a workout's most specific exercise for its card, skipping warm-ups and walks.

Run `node --test tests/exerciseArt.test.js` to check that every library and recommended exercise resolves to artwork, and that every photograph entry points at well-formed dataset frames.

- `src/App.jsx`: app shell, routes, account controls, modal orchestration.
- `src/features/tracker/data.js`: workout library, sample records, progress calculations.
- `src/features/tracker/useTracker.js`: local storage and Firebase adapters.
- `src/features/tracker/components.jsx`: accessible forms, dialogs, workout session.
- `src/features/tracker/exerciseArt.jsx`: exercise artwork, checklist, set logging, and how-to panels.
- `src/features/tracker/progressStats.js`: set, personal-record and body-weight calculations.
- `src/features/tracker/calories.js`: metabolic equivalents and the activity-calorie estimate.
- `src/features/tracker/pages.jsx`: current app pages.
- `src/App.css`: shared design tokens and responsive styles.

Earlier page components remain in `src/pages` for reference and are not imported by the redesigned application. Existing dependencies and Firebase collections are retained.

## Assets

Exercise photographs: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), served through jsDelivr; see the licence note above.

Exercise drawings: original SVGs created for this project, in `public/images/exercises`.

Hero photograph: [Jakub Balon on Unsplash](https://unsplash.com/photos/runners-legs-in-motion-on-a-track-MP38AUvIilY), available under the Unsplash License. The image is served by Unsplash. DM Sans and Manrope are loaded through Google Fonts with local sans-serif fallbacks. Lucide supplies interface icons. The app retains a usable solid-color banner if the image cannot load.

## Limitations

### Account entry and first-time setup

The home URL always offers account entry and a demo. Visitors can create an email/password account, log in, reset a password, or use Google. An existing signed-in visitor can continue or switch accounts. Google always opens the account chooser. Demo records remain separate from account data.

Signed-in users without `onboardingCompleted: true` must save a username, height in cm, weight in kg, fitness focus, and activity level before opening their dashboard. These details are stored in their own `users/{uid}` document and can be edited in My profile. Profile setup waits for that document to load and does not overwrite an unread profile. Profile saves are independent of unrelated collection failures. Unavailable account data no longer produces misleading zero totals.

Firebase project setup is separate from publishing the website:

1. In Firebase Authentication → Sign-in method, enable Email/Password and Google. Include the deployed hostname in Authentication → Settings → Authorized domains.
2. Reauthenticate the Firebase CLI with `firebase login --reauth` using an account with access to `fit-track-6baa1`.
3. Apply the owner-scoped rules using `firebase deploy --only firestore:rules --project fit-track-6baa1`. The checked-in `firebase.json` selects `firestore.rules`; it permits authenticated users to access only their own profile, workout sessions, meals, and routines.

The deployment attempt on 2026-09-13 was rejected with HTTP 401 because the CLI credentials were invalid. The live rules and enabled authentication providers could not be verified. Automated rendering checks cover the account entry and profile setup states; a real create-account/login/reset/sign-out test still requires a configured Firebase project.

Sets, body weight, steps and nutrition are manually entered; activity calories are estimated rather than measured; there is no wearable integration or automatic food database. Activity calories are not inferred from workout duration. Targets are user-selected preferences. Local browser storage is device-specific; clearing site data removes local entries. The deployed static app needs network access for Firebase, fonts, and the hero image.

## Workout recovery and corrections

- Started workout sessions automatically retain their routine snapshot, checked exercises, sets, elapsed time, and review fields in this browser. Use **Resume workout** in the unfinished-workouts panel after closing the dialog or refreshing. Reopened timers are paused. Drafts are separate for each signed-in account and local mode; they do not sync across devices. Successful completion clears the draft; discarding requires confirmation.
- Use the pencil beside a workout or meal in its history to correct an entry. Workout edits preserve routine references and exercise history, allow recorded set corrections, and retain saved calories unless changed explicitly.
- On Progress, expand **Weight history** to edit or delete individual readings. New readings and corrections have timestamps; the most recently saved reading for a date drives the trend and calorie estimates regardless of storage order. Older untimestamped readings retain their existing fallback order until corrected.
- Settings explains the duration/activity/body-weight calorie estimate and manual override.
