# Research and Decisions

Reviewed: 2026-10-11. Research was delegated to two Luna agents and independently checked by the primary agent. Findings inform design choices; they do not establish clinical efficacy or exact age/grade standards.

## Learning and social scenarios
EEF guidance supports deliberate teaching of social and emotional skills. We use short situations about listening, perspective, cooperation and respectful requests. We do not claim the game itself has a measured educational effect.
https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/primary-sel

UNICEF offers age-varied play activities. Our 6–8, 9–11 and 12–14 groups are product choices, with override controls because age alone is insufficient to infer ability.
https://www.unicef.org/parenting/child-care/screen-free-activities

## Mobile accessibility
WCAG 2.2 target-size guidance specifies a 24px minimum with exceptions. This game adopts a larger 44px target design, clear focus and non-color feedback. This is an implementation target, not an accessibility certification.
https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

## Hosting
Cloudflare Pages serves buildless HTML. Current documentation allows ZIP/folder dashboard upload and a pages.dev address. Static asset requests are currently free and unlimited, separate from Functions quotas. We use no Functions. Dashboard upload limits (1,000 files, 25MiB per asset) comfortably exceed this project's needs.
https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
https://developers.cloudflare.com/pages/get-started/direct-upload/
https://developers.cloudflare.com/pages/functions/pricing/

Direct Upload projects cannot later switch in place to Git integration; a new Pages project would be needed. Manual ZIP upload is chosen for the requested simplest handoff.

## Browser-local progress
localStorage is origin-scoped; blocking storage, private browsing or clearing data can remove persistence. Use validation, try/catch and session fallback. Do not test via file:// because behavior is not specified consistently.
https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

## Alternatives
Frameworks, server databases and AI runtime APIs add no necessary value for the approved single-device game. Their omission removes build and billing dependencies.

## Mobile renewal and encouragement audio — 2026-10-12
The Web Audio API supports locally generated oscillator and noise-buffer sounds. Start/resume audio only inside a user gesture; expose persistent mute controls, and tolerate unsupported or blocked audio. Ten synthesized patterns avoid external downloads, licensing questions and hosting requests for recordings.
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices

Dynamic viewport units track available mobile viewport space. They do not make arbitrary content fit: actual content is split into explicit screens/pages rather than clipped or reduced to tiny text. Verify the final visible DOM bounds at the documented minimum sizes and preserve accessibility fallback for zoom/exceptional constraints.
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length

Install guidance: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable and https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt (checked 2026-10-12).

## Preschool picture design — 2026-10-12
NAEYC supports playful shape exploration, matching, sorting, counting and simple patterns. CDC lists naming a few colors among four-year milestones. These inform design rather than assess an individual child.
- https://www.naeyc.org/resources/pubs/tyc/oct2014/backpack/preschoolers-natural-mathematicians
- https://www.naeyc.org/node/658
- https://www.naeyc.org/node/4685
- https://www.cdc.gov/act-early/milestones/4-years.html

Design inference: ten identical-picture matches, followed by four color matches, three quantity matches (1–3), three shape matches across color changes, then two quantity tasks (4–5), four alternating AB patterns, two size matches and two simultaneous shape/color matches. This is a product sequence, not a standardized curriculum. A helper can demonstrate the first task because this prototype deliberately has no narration. Every question includes a visual model; labels and numeric symbols are not the only cues. No timer, life loss or developmental grading is introduced.
