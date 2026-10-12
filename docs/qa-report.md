# QA Report

Release 1.2.2, checked 2026-10-12.

28 automated tests pass with no dependencies: 315 unique cards (270 academic, 45 social), all 27 round combinations, scoring, replay without duplicate awards, budget snapshots, storage migration, profile isolation, fresh question selection, sound rotation and localization confinement.

The browser round displays the prompt and all three choices together. Checked at 320x568 portrait and 640x360 landscape, including hint and answer feedback. A one-pixel overflow caused by the offscreen live region was corrected. Two actual rounds were completed through the UI. Result buttons include replay and new round / another player. Local browser data survives reload.

Budgets: young 5 lives / 3 hints; middle 3 / 2; older 2 / 1. Legacy rounds retain their old 3 / 2 snapshot.

Ten sounds include seven melodies and three synthesized clap patterns. Automated checks cover rotation and unavailable audio; listening on physical devices remains a user preview check.

Known limits: no physical Android/iOS or Safari testing; no public Cloudflare deployment. Larger accessibility text may require scrolling rather than clipping. Long saved-player and teacher lists retain navigation. Source includes an unused former compact-round renderer, bypassed by the active renderer.

Home navigation: verified the persistent header button, cancellation preserving the current screen, confirmation returning to welcome, and retained saved round/progress. At 320x568 the header fits and document width/height equal the viewport.

Release 1.2.3 greeting: approved names and wording verified in the browser. Welcome screen fits 320x568 and 640x360 without scrolling or controls outside the viewport.
