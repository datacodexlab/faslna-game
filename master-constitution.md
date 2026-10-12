# Faslna Project Constitution

Version: 1.2.2 | Approved scope: 2026-10-11 | Mobile renewal amendment: 2026-10-12

## Purpose
A cheerful Egyptian Arabic educational mobile web game for ages 6–14. Learning, cooperation and reciprocal respect are the goals. This is general learning, not a curriculum certification or treatment.

## Architecture
Buildless HTML, CSS, browser JavaScript modules and local JSON. No third-party application dependencies, accounts, server, tracking, paid API or remote asset dependency. Cloudflare Pages serves the site directory unchanged.

## Code philosophy
Implement complete flows with explicit state and recoverable errors. No temporary patches, placeholder content or unplanned TODOs. Render user names as text, never HTML. Validate persisted data. Handle unavailable storage without breaking play.

## Language and accessibility
All Arabic strings belong in site/locales/*.json; source code and comments are English. Visible interface uses Egyptian Arabic, with correct academic Arabic vocabulary. RTL, semantic controls, visible focus, large touch targets, readable contrast, reduced-motion support and no timed penalties.

## Product limits
Three subjects, three age bands, three stages, six cards per round. The expanded local bank targets 270 academic and 45 social cards. Names and teachers customize presentation; teacher subject selects academic content. Random selection avoids the preceding round's cards when the pool allows. Progress and selected cards are browser-local; no cross-device sync or leaderboards. Scores never label intelligence or moral worth.

## Versioning
Semantic versioning. Every released code change updates the visible application version and changelog. Current target release is 1.2.2.

## Round limits
Each new round snapshots budgets by its actual band: young five lives/three hints, middle three/two, older two/one. Wrong answers consume one life; zero lives ends the round. Hints are never silently granted after a mistake. Reloading preserves counters and the question draw. A failed round awards no completion, badge or permanent stars. Stage restart redraws that stage with fresh counters; home restart begins stage one after confirmation, preserving historical best results and other players.

## Mobile and audio
Use paginated steps to fit normal mobile viewports without page or inner scrolling. Never achieve this by clipping questions or making text unreadably small. Browser zoom and exceptionally constrained sizes require an accessible fallback. Ten original synthesized encouragement sounds run only after interaction, rotate without immediate repeats and have a persistent mute control. Audio failure must not prevent play.

## Authorization and review
The user explicitly approved project files, documentation, tests and deployment package on 2026-10-11, including more than five files. The primary agent reviews delegated research, content and code and may request corrections autonomously. Return to the user for scope changes or essential missing information. No Cloudflare account action is required for this ZIP handoff.
