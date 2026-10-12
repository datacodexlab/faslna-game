# Mobile and Content Renewal Plan

Version: 1.2.0 | Date: 2026-10-12 | Status: user-authorized

## Requested outcome
Keep browser-local persistence, add a home restart action, vary budgets by difficulty, renew questions through a larger local library, show symbol images, fit mobile screens without scrolling, and add ten varied encouragement sounds.

## Decisions
- Browser storage remains the only persistence layer; preserve existing players and completed progress.
- Home restart confirms replacement of the active round with a new stage-one round. It does not erase historical best scores or other players.
- Actual effective band determines budgets: young 5 lives/3 hints; middle 3/2; older 2/1. Budgets are snapshotted on round creation; changing settings or reloading cannot replenish an active round.
- Library target: 315 cards (270 academic, 45 social), 10 academic per subject/band/stage and five social per band/stage.
- Randomly draw four academic and two social cards. When the pool allows, exclude the immediately preceding round's questions. Persist the draw and selection history; do not redraw after reload.
- Avatar IDs stay compatible, but their images become sun, leaf, star and moon symbols as clarified by the user.
- Use genuine step/pagination navigation on small screens. Do not hide overflowing material, truncate questions or force tiny fonts. Default target viewports: 320x568, 360x640, 390x844 and 640x360. Preserve accessible zoom fallback outside normal default sizing.
- Ten original local synthesized sound variations, shuffled without immediate repeats, with persisted mute control. No autoplay before a user interaction or third-party sound dependency.

## Responsibilities
- Luna: 189 new concise, varied cards in an intermediate JSON file.
- Sol: game/storage/UI/symbol/audio implementation and focused unit tests.
- Primary agent: content integration, release tests, documentation, browser QA and packaging.

## Review sequence
- [x] Scope and clarification recorded; previous 1.1.0 source snapshot preserved.
- [ ] Review the expanded bank and randomized selection/persistence.
- [ ] Verify budgets, restart preservation and sound settings.
- [ ] Verify paginated screens without ordinary mobile scroll and without inaccessible clipping.
- [ ] Package verified source and deployable ZIP; refresh QA report and release hashes.

No external deployment or account change is included. Existing project instructions still apply, including reporting essential deletions exceeding the specified limit before performing them.

## Final review
Release 1.2.1 is tested and packaged. The user corrected the stepped-round design: the active renderer now shows all answer options with the question, hint and feedback. 28 automated tests pass. Actual portrait/landscape rounds and end-of-round player selection were exercised. Independent editorial follow-up ended at model usage limits; primary review corrected identified factual issues. No public deployment performed.
