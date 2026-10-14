# Faslna Project Constitution

Version: 1.5.0 | Approved scope: 2026-10-11 | Mobile renewal amendment: 2026-10-12

## Purpose
A cheerful Egyptian Arabic educational mobile web game for ages 4–14. Learning, cooperation and reciprocal respect are the goals. This is general learning, not a curriculum certification or treatment.

## Architecture
Buildless HTML, CSS, browser JavaScript modules and local JSON. No third-party application dependencies, accounts, server, tracking, paid API or remote asset dependency. Cloudflare Pages serves the site directory unchanged.

## Code philosophy
Implement complete flows with explicit state and recoverable errors. No temporary patches, placeholder content or unplanned TODOs. Render user names as text, never HTML. Validate persisted data. Handle unavailable storage without breaking play.

## Language and accessibility
All Arabic strings belong in site/locales/*.json; source code and comments are English. Visible interface uses Egyptian Arabic, with correct academic Arabic vocabulary. RTL, semantic controls, visible focus, large touch targets, readable contrast, reduced-motion support and no timed penalties.

## Product limits
Three subjects, three age bands, three stages, six cards per round. The expanded local bank targets 270 academic and 45 social cards. Names and teachers customize presentation; teacher subject selects academic content. Random selection avoids the preceding round's cards when the pool allows. Progress and selected cards are browser-local; no cross-device sync or leaderboards. Scores never label intelligence or moral worth.

## Versioning
Semantic versioning. Every released code change updates the visible application version and changelog. Current release is 1.5.0.

## Round limits
Each new round snapshots budgets by its actual band: young five lives/three hints, middle three/two, older two/one. Wrong answers consume one life; zero lives ends the round. Hints are never silently granted after a mistake. Reloading preserves counters and the question draw. A failed round awards no completion, badge or permanent stars. Stage restart redraws that stage with fresh counters; home restart begins stage one after confirmation, preserving historical best results and other players.

## Mobile and audio
Use paginated steps to fit normal mobile viewports without page or inner scrolling. Never achieve this by clipping questions or making text unreadably small. Browser zoom and exceptionally constrained sizes require an accessible fallback. Ten original synthesized encouragement sounds run only after interaction, rotate without immediate repeats and have a persistent mute control. Audio failure must not prevent play.

## Authorization and review
The user explicitly approved project files, documentation, tests and deployment package on 2026-10-11, including more than five files. The primary agent reviews delegated research, content and code and may request corrections autonomously. Return to the user for scope changes or essential missing information. No Cloudflare account action is required for this ZIP handoff.

## Release 1.4.0 — Preschool pictures and fresh start
Ages four and five now use 30 picture tasks in three progressive stages. The existing 315 cards remain, for 345 total. Stage one uses two picture options; later stages use three. Preschool answers do not play audio or lose lives; after two different mistakes the correct picture is shown and the round can continue. Six-card rounds, teacher selection, stage unlocks, saved progress and results share the existing game flow. Difficulty overrides do not move preschool players into reading questions.

Fresh start now clears the active player and teacher and opens a fresh player form with no selected name. Previous profiles and results are preserved. Empty names are rejected before advancing.

Validation: 32 automated checks pass, including all existing tests and new picture asset, age routing, nine teacher/stage round combinations, guided correction and storage checks. Browser flows completed all three preschool stages, age-four and age-five onboarding, picture help, two-error correction, fresh-start name entry and saved-card reload. Picture rounds fit 320x568 and 640x360 without scrolling. Physical mobile hardware remains untested.

## Release 1.4.1 — Relational scenes and randomized replay
Replaced all 30 preschool matching tasks with six groups of five: animal/food, animal/home, missing parts, one-item-per-plate quantities, alternating patterns and before/after natural changes. Scene images differ from all answer assets. All assets are local vectors. The existing two/three-choice progression, no-audio behavior and gentle correction remain.

New rounds are randomized for all players and age bands. Sampling now uses all available unseen cards before filling from the previous round when a small pool makes repetition unavoidable. A fresh card leads the round whenever available. Saved unfinished rounds retain their draw when resumed. The former preschool question IDs were retired so unfinished obsolete rounds recover safely while saved profile results remain.

Automated verification: 33 checks, including all previous tests, six relational skill groups, image assets and minimum-repeat replay across preschool stages; older-age randomized replay checks remain. Browser verification covered a completed relational round, all image loading, resumed draw and portrait/landscape layout. Physical mobile devices remain untested.

## Approved interaction amendment — 2026-10-14
Answers require selection then confirmation on the same option. Victory effects remain local, bounded, nonblocking and respectful of reduced-motion preferences.
