# Project Context

Status: release 1.2.2 packaged and tested; local preview available for user review before deployment.
Target release: 1.2.2 (2026-10-12). Previous verified release: outputs/faslna-v1-1-0.

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
User approved a public repository named faslna-game under the DataCodex account they will select in Git. Local Git repository initialized on main. Remote creation and upload are pending account selection; no remote repository is claimed.
