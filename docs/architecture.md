# Technical Architecture

Deployment root: site/. HTML loads CSS, local assets and ES modules; modules fetch localization/content JSON over HTTP. No install or build step.

Application responsibilities: initialization and navigation, rendering, pure game logic, profile/progress state and defensive browser storage. Sol may divide these into small English-named modules under site/scripts/.

Content contract: {schemaVersion:1,cards:[{id,kind,band,subject,stage,prompt,options:[{id,text}],answerId,hint,explanation}]}. Bands: young,middle,older. Subjects: math,arabic,science,social. Stage: integer 1–3. Academic rounds select four matching band/subject/stage cards and two band/stage social cards.

Store contract must be versioned; profiles have independent IDs rather than being keyed solely by display name. Progress key includes subject and difficulty band. Selected teacher identity does not duplicate progress for the same subject. Awards reflect best/completed stage state, preventing repeated totals on replay.

Round state includes livesLeft (0–3), hintsLeft (0–2) and per-card hintUsed. Pure game functions enforce budgets and terminal failure. Wrong choices remain disabled and cannot consume a life twice. A storage migration supplies counters for older rounds; content-based recovery still validates card references. Failed rounds persist until explicitly restarted or dismissed to the map.

All dynamic user text is inserted as text. External network requests are unnecessary. Cloudflare _headers sets sensible CSP/security headers and revalidation for mutable app assets; no service worker or offline cache is added.

Testing uses built-in Node facilities where available, JSON content validation and browser interaction through available browser tooling. Tests and docs are not included in the public site ZIP.
