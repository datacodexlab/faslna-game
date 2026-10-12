# QA Report

Release 1.2.2, checked 2026-10-12.

28 automated tests pass with no dependencies: 315 unique cards (270 academic, 45 social), all 27 round combinations, scoring, replay without duplicate awards, budget snapshots, storage migration, profile isolation, fresh question selection, sound rotation and localization confinement.

The browser round displays the prompt and all three choices together. Checked at 320x568 portrait and 640x360 landscape, including hint and answer feedback. A one-pixel overflow caused by the offscreen live region was corrected. Two actual rounds were completed through the UI. Result buttons include replay and new round / another player. Local browser data survives reload.

Budgets: young 5 lives / 3 hints; middle 3 / 2; older 2 / 1. Legacy rounds retain their old 3 / 2 snapshot.

Ten sounds include seven melodies and three synthesized clap patterns. Automated checks cover rotation and unavailable audio; listening on physical devices remains a user preview check.

Known limits: no physical Android/iOS or Safari testing; no public Cloudflare deployment. Larger accessibility text may require scrolling rather than clipping. Long saved-player and teacher lists retain navigation. Source includes an unused former compact-round renderer, bypassed by the active renderer.

Home navigation: verified the persistent header button, cancellation preserving the current screen, confirmation returning to welcome, and retained saved round/progress. At 320x568 the header fits and document width/height equal the viewport.

Release 1.2.3 greeting: approved names and wording verified in the browser. Welcome screen fits 320x568 and 640x360 without scrolling or controls outside the viewport.

## 1.3.0 — Mobile installation
Added localized standalone web app manifest, 192/512 PNG icons with safe maskable artwork, and 180px Apple touch icon. Welcome installation invitation appears once per mobile browser session and hides in standalone mode. Supporting browsers use the native prompt after a user click; others receive localized menu instructions. No service worker or offline promise is introduced, avoiding stale cached releases. Existing local progress is unchanged. Browser UI checked at 320x568 and 640x360; actual device installation after HTTPS deployment remains untested.

## Release 1.4.0 — Preschool pictures and fresh start
Ages four and five now use 30 picture tasks in three progressive stages. The existing 315 cards remain, for 345 total. Stage one uses two picture options; later stages use three. Preschool answers do not play audio or lose lives; after two different mistakes the correct picture is shown and the round can continue. Six-card rounds, teacher selection, stage unlocks, saved progress and results share the existing game flow. Difficulty overrides do not move preschool players into reading questions.

Fresh start now clears the active player and teacher and opens a fresh player form with no selected name. Previous profiles and results are preserved. Empty names are rejected before advancing.

Validation: 32 automated checks pass, including all existing tests and new picture asset, age routing, nine teacher/stage round combinations, guided correction and storage checks. Browser flows completed all three preschool stages, age-four and age-five onboarding, picture help, two-error correction, fresh-start name entry and saved-card reload. Picture rounds fit 320x568 and 640x360 without scrolling. Physical mobile hardware remains untested.
