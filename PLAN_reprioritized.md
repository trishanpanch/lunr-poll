# Harvard Poll Product Plan — Reprioritized After Strategy Meeting
## Date: March 11, 2026

## Executive Summary
This version of the plan has been reprioritized to reflect the decisions and emphasis from the meeting.

The central conclusion from the discussion was that the team should **ship a narrow, usable MVP first**, rather than trying to build the fuller long-term vision immediately. The immediate objective is not to create a broad AI teaching platform, a faculty operating system, or a transcription-driven learning suite. The immediate objective is to make the current polling product reliable, understandable, reusable, and pilot-ready.

The meeting also made clear that three workstreams need to be separated:

1. **MVP execution** — fix bugs, improve usability, and make the core polling workflow work cleanly.
2. **Pilot and go-to-market** — prepare for a small initial launch, likely with Harvard-adjacent credibility and pilot conversations, but without making institutional partnership a dependency for launch.
3. **Longer-horizon product discovery** — explore AI-native extensions such as content-to-quiz generation, lecture-linked workflows, and broader training use cases, but do not let these expand the MVP.

This document therefore changes the planning logic from a broad feature roadmap to an **MVP-first operating plan**, with explicit deferral of adjacent ideas.

---

# 1. Product Strategy

## Primary objective
Launch a credible MVP for interactive polling that is stable enough for real instructional use.

## Product framing for MVP
For now, the product should be framed as:

**An AI-native tool for making teaching sessions interactive through live polls and lightweight audience participation.**

That framing is deliberately narrower than the long-term opportunity. It is legible, launchable, and consistent with the meeting discussion.

## What this means in practice
The product plan for the next two sprints should optimize for:
- reliability in live classroom use
- ease of launching and reusing a poll
- clarity in authoring and onboarding
- enough polish to support pilot conversations

The product plan should **not** optimize for:
- broad faculty productivity workflows
- dashboards, annual reporting, or institutional intelligence features
- complex multimodal AI features unless already substantially built
- expansion into every possible survey or assessment mode before MVP launch

---

# 2. Reprioritization Logic

## New priority hierarchy

### P0 — Must ship before MVP release
Critical fixes or workflows that directly determine whether the product can be used confidently in a live teaching environment.

### P1 — Strongly desirable for MVP or immediate post-MVP pilot
High-value improvements that materially improve comprehension, authoring speed, or reuse, but are not as fundamental as P0.

### P2 — Post-MVP expansion
Useful enhancements that should not delay the MVP.

### P3 — Discovery only
Strategic opportunities discussed in the meeting that should be explored separately and must not expand current delivery scope.

## Revised delivery sequence
1. Stabilize the live polling product.
2. Make the authoring and reuse workflow clear.
3. Launch to a narrow pilot group.
4. Run discovery on AI-native expansion and adjacent training markets.

---

# 3. MVP Scope for the Next Two Sprints

## MVP release rule
Anything that does not clearly improve the core polling workflow, the instructor launch flow, or reuse across cohorts should be presumed out of scope unless explicitly approved.

## Must-have MVP outcomes
By the end of this cycle, an instructor should be able to:
- create or generate a poll without confusion
- launch it reliably in class
- let learners respond without display/readability issues
- reuse the poll for another cohort without rebuilding it
- understand what to do after a poll closes

---

# 4. Sprint Plan

## Sprint 1 — Core MVP stabilization
**Goal:** Remove the largest barriers to live use and repeat use.

### Epic A: Live delivery must work cleanly

#### Ticket A1
**Title:** Fix unreadable answer options in live poll view  
**Priority:** P0  

**Why it moved up:**  
This is a direct classroom usability blocker. If learners cannot read the options cleanly, the MVP is not trustworthy.

**Scope:**
- Fix layout and wrapping behavior for long answer choices
- Validate in student live view, instructor presentation view, and result contexts as needed
- Test desktop and mobile

**Acceptance criteria:**
- Long answer text never overlaps chart or adjacent content
- Option text remains readable across realistic classroom examples
- No regression for shorter responses

#### Ticket A2
**Title:** Add one-click “Launch All Questions”  
**Priority:** P0  

**Why it moved up:**  
The meeting emphasized that the current workflow feels too constrained when an instructor wants to release the full set at once.

**Scope:**
- Add a clear control to launch all questions in a poll
- Preserve existing one-by-one release behavior
- Keep the mode obvious in the UI

**Acceptance criteria:**
- Instructor can launch the full poll in one step
- Sequential launch still works
- Student view reflects the intended launch mode correctly

#### Ticket A3
**Title:** Add “Relaunch for New Cohort” workflow  
**Priority:** P0  

**Why it moved up:**  
The meeting strongly emphasized reuse. Rebuilding the same poll for each new group is unnecessary friction and undermines the product’s value.

**Scope:**
- Allow a closed poll to be relaunched as a fresh run
- Preserve historical results
- Reset participation state without forcing duplication or reconstruction

**Acceptance criteria:**
- Instructor can relaunch a previously used poll for a new audience
- Old results remain accessible
- New responses do not overwrite prior response sets

### Epic B: Post-session workflow must be understandable

#### Ticket B1
**Title:** Improve post-close workflow from report view  
**Priority:** P0  

**Why it moved up:**  
The meeting made clear that the current end-state is too ambiguous. The instructor should immediately understand whether to review, relaunch, or archive.

**Scope:**
- Clarify available next actions after close
- Expose review, relaunch, and archive/reset actions clearly
- Reduce ambiguity around reuse

**Acceptance criteria:**
- Closed-state UI presents obvious next steps
- Instructor can move directly from results to reuse actions
- Product behavior is unambiguous after closure

### Epic C: Authoring must be understandable enough for pilot users

#### Ticket C1
**Title:** Rename “Magic” to a clearer label  
**Priority:** P1  

**Why it remains important:**  
The meeting emphasized usability and pilot readiness. “Magic” is not explanatory enough for new users.

**Scope:**
- Rename to a clearer label such as `AI Question Generator`
- Add one-line helper text
- Preserve easy access in authoring flow

**Acceptance criteria:**
- New users can infer what the feature does
- New label appears consistently everywhere relevant
- Access remains simple and prominent

#### Ticket C2
**Title:** Add minimal onboarding and empty-state guidance  
**Priority:** P1  

**Why this was added:**  
The meeting repeatedly emphasized that the MVP should feel usable and coherent, not merely featureful. Some of that is an onboarding problem, not a feature problem.

**Scope:**
- Improve empty states in authoring and poll library views
- Add concise guidance on how to create, launch, and reuse a poll
- Keep onboarding lightweight rather than tutorial-heavy

**Acceptance criteria:**
- First-time instructors can understand the primary workflow without explanation from the team
- Empty states guide action rather than creating uncertainty
- Pilot users can reach first poll launch with less friction

---

## Sprint 2 — Pilot readiness, not feature sprawl
**Goal:** Add only those enhancements that improve pilot utility or reduce avoidable confusion.

### Epic D: Improve AI authoring where it directly supports MVP adoption

#### Ticket D1
**Title:** Expand AI question generation controls  
**Priority:** P1  

**Why it stays in scope:**  
This aligns with the product’s AI-native positioning and improves the speed of creating a useful poll, but should be kept pragmatic.

**Scope:**
- Add `Purpose of poll`
- Add `How many questions`
- Add `Question types`
- Add `Difficulty level`
- Support simple mixed-generation where feasible

**Acceptance criteria:**
- Instructor can specify purpose, count, type, and difficulty
- Output reflects intent well enough for immediate editing or use
- Generated questions insert cleanly into the editor

#### Ticket D2
**Title:** Add AI “Auto” type selection  
**Priority:** P2  

**Why it moved down:**  
Useful, but not essential for MVP. This should not delay launch if basic generation works.

**Scope:**
- Add `Auto` type suggestion mode
- Allow prompt intent to shape question type suggestions

**Acceptance criteria:**
- Auto mode generates plausible type selections
- Manual override remains available

### Epic E: Support one additional meaningful teaching mode

#### Ticket E1
**Title:** Add self-paced multi-question mode  
**Priority:** P1  

**Why it remains in consideration:**  
The meeting highlighted the desire to let all questions go live at once in some cases. This can materially improve applicability for certain sessions.

**Scope:**
- Add `paced` vs `self-paced` mode
- Preserve current instructor-led sequencing
- Make the mode selection explicit

**Acceptance criteria:**
- Self-paced mode allows completion of the full set in one pass
- Existing paced mode remains unchanged
- Instructor understands which mode is active

#### Ticket E2
**Title:** Add assessment mode with correct answers and explanations  
**Priority:** P2  

**Why it moved down:**  
This is strategically attractive, but the meeting did not support letting assessment complexity delay the basic MVP. It is a post-MVP enhancement unless it can be implemented cheaply.

**Scope:**
- Allow marking correct answer(s)
- Add optional explanation reveal
- Provide basic aggregate correctness insight

**Acceptance criteria:**
- Correct answers can be authored
- Reveal behavior works as configured
- Aggregate reporting reflects correctness

### Epic F: Make poll management good enough, not exhaustive

#### Ticket F1
**Title:** Add duplicate poll action  
**Priority:** P1  

**Why it moved up relative to other library work:**  
The meeting emphasized reuse. Duplication may be a simple fallback even if relaunch is the preferred workflow.

**Scope:**
- Add duplicate action in poll detail or library view
- Preserve structure and content on duplication

**Acceptance criteria:**
- Instructor can duplicate a poll quickly
- Duplicate is ready for editing or rerun

#### Ticket F2
**Title:** Improve basic library organization  
**Priority:** P2  

**Why it moved down:**  
Useful, but the meeting did not suggest that a rich folder/search system is needed before MVP. A minimal viable management layer is enough initially.

**Scope:**
- Support simple foldering or grouping if already partially built
- Add basic search by title only if low effort

**Acceptance criteria:**
- Existing polls are not hard to locate in realistic early usage
- Reuse is not blocked by organizational friction

---

# 5. Explicitly Deferred From MVP

These items may be valuable, but they should not delay launch.

## Deferred product enhancements
- broad mixed-type survey sophistication
- advanced reveal timing controls
- elaborate library sort/filter systems
- comprehensive assessment workflows
- feature expansion across multiple parallel architecture paths

## Deferred strategic concepts
- AI lecture notes
- lecture transcription and post-lecture podcast summaries
- math/code explanation assistants
- faculty news/research briefings
- annual faculty work dashboards
- full “faculty operating system” positioning

The meeting generated strong ideas in these areas, but they belong in a later roadmap or discovery memo, not the immediate build plan.

---

# 6. Parallel Non-Engineering Workstream: Pilot and Distribution

The meeting made clear that product work alone is not the whole story. A second stream should run in parallel to prepare for external validation.

## Objective
Prepare the MVP for a narrow pilot without making institutional partnership a launch dependency.

## Work items

### GTM-1
**Title:** Define launch narrative and product positioning  
**Priority:** P0

**Deliverable:**
- one-paragraph product description
- who it is for
- what problem it solves now
- what it is explicitly not yet

### GTM-2
**Title:** Prepare Harvard-adjacent pilot conversations  
**Priority:** P1

**Deliverable:**
- target list of pilot champions or friendly users
- pilot ask
- demo flow
- list of questions to test with partners

### GTM-3
**Title:** Evaluate institutional path separately from product launch  
**Priority:** P2

**Questions to answer:**
- Is Harvard best treated as a pilot site, credibility partner, or formal institutional relationship?
- What branding or endorsement permissions would be required?
- Is any “spinout” framing actually appropriate at this stage?

This workstream is strategically important, but it should not hold the product hostage.

---

# 7. Discovery Track for Post-MVP Strategy

This section captures the larger opportunity from the meeting without letting it affect current sprint scope.

## Discovery themes

### Discovery 1: AI-native content-to-poll workflow
The most promising long-term product direction discussed in the meeting was not manual polling alone, but generating interactions directly from source content such as:
- PDFs
- lecture materials
- slide decks
- transcripts
- other teaching resources

**Deliverable:** short discovery memo covering user value, technical feasibility, and whether this becomes the next major bet after MVP.

### Discovery 2: Broader training market
The meeting surfaced a broader market thesis beyond academia, including workplace and vocational training.

**Questions to test:**
- Is the real product category broader than classroom polling?
- Are training buyers easier to convert than university channels?
- Does this market care more about quiz generation than live polling?

**Deliverable:** market hypothesis memo with 3–5 candidate pilot segments.

### Discovery 3: Naming and brand direction
The current naming appears provisional.

**Deliverable:**
- temporary working product name
- naming criteria for longer-term brand
- separation between repo names and market-facing names

---

# 8. Architecture Guidance

The current repository appears to include both older and newer workflow models. The meeting implicitly supported speed and simplification over elegant completeness.

## Recommendation
- Fix urgent user-facing issues wherever the active user path currently lives
- Avoid duplicate implementation across legacy and newer systems unless absolutely necessary
- Prefer architectural consolidation only where it does not slow the MVP

The right architecture decision for this phase is the one that helps the team launch fastest without creating obvious rework traps.

---

# 9. Test Plan

## Must-pass regression tests
- existing one-question pacing still works
- presets/templates still work
- PDF, PNG, and CSV export still work

## Must-pass MVP behavior tests
- long answer labels remain readable in live use
- instructor can launch all questions in one step
- instructor can relaunch a poll for a fresh cohort without losing old results
- post-close UI makes next actions obvious
- first-time user can understand the AI authoring flow
- onboarding/empty states reduce confusion rather than add it

## Nice-to-have tests before pilot
- self-paced mode works reliably if included in MVP
- duplicate poll action works cleanly
- expanded AI controls behave consistently

---

# 10. Success Metrics

The meeting implied that success should be measured by usability and repeatability, not by breadth of features.

## Core MVP metrics
- time from sign-up to first launched poll
- reduction in instructor confusion during creation and launch
- successful reuse of a poll across cohorts
- percentage of pilot users who complete a live session without manual team support
- qualitative feedback that the product feels easier or more modern than current alternatives

## Secondary metrics
- usage of AI-assisted question generation
- number of polls relaunched or duplicated
- pilot conversion into repeat usage

---

# 11. Final Operating Instruction

For the next cycle, the team should follow a simple rule:

**Do not add features merely because they are exciting. Add only what materially improves launch readiness, live usability, or poll reuse.**

That is the clearest reflection of the meeting.
