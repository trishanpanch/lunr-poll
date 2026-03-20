# Project TODO

## Bugs
- [x] AI generation 401 error — VITE_FRONTEND_FORGE_API_KEY is invalid; needs backend proxy route using BUILT_IN_FORGE_API_KEY
- [x] Session state not cleared on new session — old name/code/questions persist when leaving without saving and starting a new session

## Features
- [x] AI panel → collapsible drawer — convert the Generate with AI sidebar into a slide-in drawer with a tab handle and backdrop overlay

## Polish
- [x] Changelog mono font — apply monospace font to the "Changelog" header pill and "N updates" count badges (tag badges already done)
- [x] Changelog should not visually affect the Design System page — confirm styles are fully scoped and do not bleed across routes (all styles are inline, no shared CSS imports)
- [ ] Favicon in dashboard view — clarify which dashboard (Manus UI vs. My Sessions vs. browser tab) and fix the wrong icon

## Completed
- [x] Standardise null states — professor-facing null states (session builder + my sessions) use same typography and full-opacity emoji; join session screen also uses full-opacity emoji
- [x] Update design system interaction patterns
- [x] Fix color swatches not showing in Design System (missing --green, --amber, --destructive-light tokens)
- [x] Add True/False to Question Types section in Design System
- [x] Update null state documentation in Design System
- [x] Replace fake AI generation with real Forge API call using knowledge-atom extraction prompt
- [x] Pass MC options and correctAnswer through to session when adding AI-generated questions
- [x] Show MC options and TF answer inline in AI panel preview cards
- [x] Change "Add another question" button icon from ChevronRight to Plus
- [x] Change Changelog tag badge font to monospace (Geist Mono)
- [x] AI preview cards — text cut off — question text textarea, MC option inputs, and model answer textarea all clip content; fix with auto-height textareas and wrapping inputs
- [x] AI drawer tab — tab doesn't open the drawer; also move tab from vertical-center to top of the panel
- [x] URL source material — add URL input to AI panel; server fetches page and extracts text; extracted text populates the source material textarea
