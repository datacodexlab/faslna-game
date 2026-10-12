# Product Requirements — 1.1.0

## Screens and flows
1. Welcome: product identity, start/resume, how to play, visible version.
2. Player: preset names or a custom nickname, age 6–14, avatar, saved profile selection. Names are limited in length and trimmed.
3. Teacher: choose a default or saved teacher; add a local teacher with name and one subject. Selected subject determines the learning questions.
4. Adventure map: three progressive stages, current player/teacher, subject, explicit actual difficulty band, easier/harder control, stars and progress.
5. Round: six cards (four academic, two social); prompt and three options; hint, explanation, retry, next. Three lives and two hints cover the entire round. Each wrong answer consumes one life. The third mistake leads to game over. No timer.
6. Results: round score, stage completion, positive message, next stage or return to map. Replays do not inflate permanent completion awards.
7. Help/settings: local-storage explanation, motion preference where useful, reset with explicit confirmation, player switching.

## Content
315 stable-identified cards in JSON. Academic: 3 subjects x 3 bands x 3 stages x 4. Social: 3 bands x 3 stages x 2. The shared social bank may recur when switching subjects. Every card has exactly three distinct options, one answer, hint and explanation.

## Difficulty and progression
Age sets the default band; a visible override selects adjacent bands without changing the child's age. Stage progress is scoped to profile, subject and actual band. The next stage opens on completion; score is encouraging feedback, not a gate or intelligence estimate.

Each correct first response earns two stars; a correct response after a hint or retry earns one. A successful completed round earns 8–12 stars under the two-hint/three-life limits. Permanent totals use each stage's best result; replaying cannot repeatedly add the same award. One badge is earned for each completed stage. An unfinished round is resumable after switching players or teachers. A failed round can restart from card one or return to the map; it never unlocks a stage or alters previous best results. Reloading never replenishes lives or hints.

## Persistence and errors
Persist local profiles, local teachers, settings and progress. Resume unfinished rounds with their original teacher, card, hint and answer state. Invalid round references are cleared while preserving valid profile and completed progress. Corrupt/unavailable storage must not prevent a session. Failed localization loading displays an English fallback with a retry path because Arabic is restricted to localization files.

## Acceptance
All flows work without an account; all Arabic text lives in JSON. Three stages are playable in every subject and band. No missing assets, console exceptions or duplicate completion awards. Root index.html works from a local HTTP server and the ZIP deployment root.
