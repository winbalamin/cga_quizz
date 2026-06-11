Phase 1: Environment Setup & Core Architecture
Initialize the Next.js project container incorporating Tailwind CSS and shadcn/ui.

Map out the Prisma schema models and synchronize migrations directly onto the target PostgreSQL instance.

Configure internationalized validation patterns (Zod schema) for phone numbers and input metrics.

Phase 2: Administrative Controls (Internal Backend)
Formulate Auth.js configurations to guard administrative endpoints (/admin/*).

Design the Dynamic Question Form UI to seamlessly switch state engines based on QuestionType.

Construct standard API endpoints/Server Actions managing full Question and User CRUD pipelines.

Phase 3: Client Engine & Persistent State Tracking
Design the landing landing and entry forms incorporating synchronous duplicate entry checking.

Establish the persistent 30-minute timer using client-side React hooks calibrated against server-validated timestamps.

Construct the isolated interactive testing layout managing standard form submissions.

Phase 4: Scoring Analytics, Leaderboarding & Production Deploy
Implement server-side grading algorithms (preventing correct keys from leaking to client-side bundles).

Standardize automated sorting queries to render real-time indexed data views (Leaderboard).

Perform continuous deployment pipelines on Vercel infrastructure.
"""