# Project Key

- master-constitution.md: approved architecture and rules.
- project-context.md: current project state and verification limits.
- changelog.md: release history.
- docs/vision.md: product goals and limits.
- docs/risk-assessment.md: risks and controls.
- docs/prd.md: screens, behavior and acceptance.
- docs/ux.md: visual and interaction design.
- docs/research.md: primary sources and decisions.
- docs/architecture.md: static architecture and contracts.
- docs/qa-report.md: observed checks and verification limits.
- plans/01-plan-release.md: approved implementation sequence.
- site/: deployable static website; index.html is the deployment root.
- site/locales/ar-ui.json: interface copy and defaults.
- site/locales/ar-content.json: 315 reviewed educational cards.
- site/assets/styles.css: responsive RTL visual system.
- site/assets/classroom.svg and favicon.svg: local school artwork and identity.
- site/assets/avatar-{sun,leaf,star,moon}.svg: four child characters.
- site/scripts/app.js: screens, localization, input and navigation.
- site/scripts/game.js: difficulty, rounds, rewards, progression and saved-round recovery.
- site/scripts/audio.js: ten rotating Web Audio melodies and clap effects.
- tests/audio.test.mjs: preset distinctness, rotation and unavailable audio.
- site/scripts/storage.js: validated browser storage with session fallback.
- site/_headers: Cloudflare security headers and asset revalidation.
- tests/content.test.mjs: 315-card bank, diversity and source-language constraints.
- tests/game.test.mjs: scoring, difficulty, completion and recovery.
- tests/storage.test.mjs: persistence, presets, reset and unavailable storage.
- tests/release.test.mjs: all 27 real-content rounds and profile/subject isolation.
- package.json: module mode and dependency-free test command.
- README.md: Egyptian Arabic instructions and deployment guide.

The final delivery archive contains only site contents. Source documentation and tests are supplied separately in the complete project folder and full-project ZIP. Sibling output files faslna-cloudflare.zip and faslna-project.zip are deployment and source deliverables. Preview JPEGs and faslna-release.json provide verification evidence and release hashes.

- site/locales/ar-manifest.json: localized install manifest.
- site/assets/icon-180.png, icon-192.png, icon-512.png: home screen icons.
- tests/install.test.mjs: resolved install scope and actual icon dimensions.

- site/locales/ar-preschool.json: 30 picture tasks and accessible option labels.
- site/assets/preschool/*.svg: local shapes, objects, quantities and AB patterns.
- tests/preschool.test.mjs: assets, age routing, guided correction and persistence.
- plans/03-plan-preschool.md: approved preschool feature and restart repair.
