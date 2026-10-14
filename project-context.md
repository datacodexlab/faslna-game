# Project Context

Status: release 1.4.1 packaged and tested; local preview available for user review before deployment.
Target release: 1.4.1 (2026-10-12). Previous verified release: outputs/faslna-v1-1-0.

## Decisions
- Name: Adventures of Our Classroom (Egyptian Arabic display copy in localization).
- Buildless static website, no external dependencies.
- Ages 6–8, 9–11, 12–14 with explicit easier/harder level override.
- 270 academic questions, 45 social scenarios; three stages for each band and subject.
- Local profiles, teacher list and progress on the same browser.
- Primary agent approves internal milestones; user approval covers the specified project scope.

## Completed
Luna prepared research and content drafts; Sol implemented the UI, game, storage, avatars and logic tests. The primary agent reviewed and revised the question bank, integrated the release, tested real browser flows and prepared the deployment package.

The first content draft was rejected for repeated question templates. The final bank has 315 reviewed cards with genuinely varied academic prompts. Review also fixed preset-teacher persistence, guided rewards, stale-round recovery and long-name mobile overflow.

Verification: 28 automated tests passed, including all 27 full rounds, finite hints/lives, game over, score/replay behavior, profile isolation, content contracts, localization confinement and storage recovery. Browser flows passed in the Codex in-app browser at mobile and desktop viewport sizes. Limits persist across reload; restart begins from card one. Earlier saved rounds gain limits without losing completed progress. See docs/qa-report.md.

## Known limits
Age bands are design choices and do not certify a national curriculum. Storage can be cleared or blocked. No device synchronization. Actual Safari/iOS and Android hardware have not been tested. No Cloudflare account was used and no public deployment is claimed. The next step is uploading the verified ZIP using README.md.

## Mobile round layout correction
The full question, all three answer buttons, hint and feedback now share one mobile screen. Answer pagination is bypassed. Result and game-over screens offer replay and another-player selection. Existing browser data is preserved. Follow-up release verification is in progress.

## Current release 1.2.2
315 cards integrated; primary review corrected ambiguous cube/grid prompts, Arabic capitalization, adverb and dual wording, and a physics card classified as mathematics. Automated checks: 28 passing. Full simultaneous round choices verified at portrait and landscape sizes. Browser preview remains available before publication. Luna editorial follow-up was interrupted by usage limits; no independent final editorial sign-off is claimed.

## 1.2.2 — Persistent home navigation
A header button is available on every screen. Returning home requires confirmation and preserves browser profiles, progress and the current round. Cancelling keeps the current screen. The mobile header fits without overlaying round controls.

## 1.2.3 — Creator greeting
Added the approved localized greeting for Maryam, Marwa and Doaa to the welcome screen, with compact responsive styling. No saved data changes.

## GitHub publication preparation
User approved a public repository named faslna-game under the DataCodex account they will select in Git. Local Git repository initialized on main. Published to the public repository https://github.com/datacodexlab/faslna-game on main after the user supplied its URL. Source, documentation and tests are uploaded; Cloudflare deployment remains separate.

## 1.3.0 — Mobile installation
Added localized standalone web app manifest, 192/512 PNG icons with safe maskable artwork, and 180px Apple touch icon. Welcome installation invitation appears once per mobile browser session and hides in standalone mode. Supporting browsers use the native prompt after a user click; others receive localized menu instructions. No service worker or offline promise is introduced, avoiding stale cached releases. Existing local progress is unchanged. Browser UI checked at 320x568 and 640x360; actual device installation after HTTPS deployment remains untested.

## Release 1.4.0 — Preschool pictures and fresh start
Ages four and five now use 30 picture tasks in three progressive stages. The existing 315 cards remain, for 345 total. Stage one uses two picture options; later stages use three. Preschool answers do not play audio or lose lives; after two different mistakes the correct picture is shown and the round can continue. Six-card rounds, teacher selection, stage unlocks, saved progress and results share the existing game flow. Difficulty overrides do not move preschool players into reading questions.

Fresh start now clears the active player and teacher and opens a fresh player form with no selected name. Previous profiles and results are preserved. Empty names are rejected before advancing.

Validation: 32 automated checks pass, including all existing tests and new picture asset, age routing, nine teacher/stage round combinations, guided correction and storage checks. Browser flows completed all three preschool stages, age-four and age-five onboarding, picture help, two-error correction, fresh-start name entry and saved-card reload. Picture rounds fit 320x568 and 640x360 without scrolling. Physical mobile hardware remains untested.

## Release 1.4.1 — Relational scenes and randomized replay
Replaced all 30 preschool matching tasks with six groups of five: animal/food, animal/home, missing parts, one-item-per-plate quantities, alternating patterns and before/after natural changes. Scene images differ from all answer assets. All assets are local vectors. The existing two/three-choice progression, no-audio behavior and gentle correction remain.

New rounds are randomized for all players and age bands. Sampling now uses all available unseen cards before filling from the previous round when a small pool makes repetition unavoidable. A fresh card leads the round whenever available. Saved unfinished rounds retain their draw when resumed. The former preschool question IDs were retired so unfinished obsolete rounds recover safely while saved profile results remain.

Automated verification: 33 checks, including all previous tests, six relational skill groups, image assets and minimum-repeat replay across preschool stages; older-age randomized replay checks remain. Browser verification covered a completed relational round, all image loading, resumed draw and portrait/landscape layout. Physical mobile devices remain untested.

## Release 1.5.0 — Confirmed choices and victory celebrations
User approved ten lightweight randomized victory effects and two-press answer confirmation on 2026-10-14. First press selects an option in yellow without scoring or spending lives; pressing that option again submits it. Selecting another option replaces the pending choice. Correct answers are green and wrong answers red, including wrong choices after guided preschool resolution. Pending choices are transient and cleared on navigation. Saved round schema is unchanged.

Ten local canvas effects rotate randomly without immediate repeats: stars, rockets, confetti, balloons, fireworks, bubbles, rainbow, butterflies, starburst and trophy. Effects last three seconds, never intercept clicks, clean up on navigation and use a static two-second composition for reduced motion. No dependencies or additional audio.

Validation: 35 automated checks passed. Browser verified yellow selection with unchanged score, confirmed wrong red, correct green, saved preschool round completion and result flow. Portrait 320x568 stayed within viewport. Physical device testing remains outstanding.
