# Pivot: from "Resume/ATS tool" → an engineering student's 4-year buddy

**Date:** 2026-06-24
**Status:** Brainstorm **parked** mid-conversation (at Question 2). Not yet a finalized design. Resume via `/superpowers:brainstorming`.

---

## Why pivot

The product has drifted "too generic" — Resume + ATS reads like a feature, not a product. The intent is to make **resume/ATS one module**, and position the whole thing as a **buddy for an engineering student across all 4 years of college**: finding jobs, people to reach out to, skilling up, catching up in tech, LinkedIn, AI tools.

**Key tension named in the brainstorm:** adding "everything" usually makes a product *more* generic, not less. The cure for generic is not more features — it's a **spine**: one specific idea that makes the whole thing feel like *one buddy* instead of a toolbox.

> This vision spans 5–6 independent subsystems. It is **too big for one spec**. Plan: lock the north-star framing (spine + module map + sequence), then design **one module at a time**, each with its own spec → plan → build.

---

## The spine we landed on: **"Your daily deck"**

Every day the buddy hands you a **small, finite stack of cards** — jobs to apply to + people worth reaching out to — and you **swipe left/right (Tinder-style)**. The deck is **capped per day** (anti-spam, anti-doomscroll), gamified, a ~60-second habit.

- The **daily ritual is the product.** A daily, bounded ritual is what earns the "4-year buddy" claim — *the relationship is the streak.*
- This is a **ritual**, not a toolbox — which is the antidote to "too generic."

### The moat: a right-swipe must **act**, not bookmark

This is the unfair advantage — the machinery already exists in the codebase:

- Swipe right on a **job** → auto-tailor resume to that JD → draft the application → drop it in the tracker.
- Swipe right on a **person** → draft the cold email / LinkedIn DM from your profile.

Most "Tinder for jobs" apps just bookmark. This one *does the work*. That payoff is the core design problem of the first module.

---

## What already exists (this is a reframe, not a rewrite)

The entire **job-hunt half** is already built in `resume-ai/`:

- Resume editor (Jake template) + **ATS** check + AI bullet rewrite / tailor-to-JD.
- **Application tracker** (8-stage board), **opportunity feed**.
- **Cold outreach** (find contacts → draft cold email / DM / referral request).
- **Nudge engine** (scheduled follow-ups).
- **Interview prep** (STAR) + offer comparison.
- **Source imports**: GitHub, LeetCode, Codeforces, LinkedIn, old resume PDF → a profile of "what you've built."

The pivot wraps these behind the daily-deck ritual and adds the genuinely new modules (skill-up, catching up in tech) later.

---

## Open questions (where we paused)

**Q2 (current, unanswered) — what's in the daily deck, and does it change by year?**
- **A)** Two card types always: jobs + people (laser-focused on the hunt).
- **B)** A mixed deck that shifts by phase (freshman → skill-up + seniors to meet; sophomore → projects + first internships; junior → internships + outreach; senior → full-time + referrals). True 4-year companion, bigger scope.
- **C) (recommended)** Jobs + people now, but architect the deck so skill-up / tech-catch-up cards slot into the same swipe ritual later. Sharp wedge now, 4-year vision later.

**Downstream questions to resolve after Q2:**
1. **Swipe-right payoff** — exact actions per card type, and how much is auto vs. one-tap confirm.
2. **Job sourcing** — where the daily jobs actually come from (APIs / scraping / the existing opportunity feed). *Hardest infra problem.*
3. **People sourcing** — alumni / contacts at target companies (ties to existing outreach "find targets").
4. **Matching / personalization** — how the deck is picked from your imported profile + goals + year.
5. **Daily cap + streak mechanics** — deck size, refill cadence, streak/gamification.
6. **Phase/year detection** — how the buddy knows you're a freshman vs senior.

---

## Decision log

- Reframe resume/ATS to a **module**, not the product. ✅ direction agreed
- Spine = **"daily deck"** (finite, gamified, rate-limited daily swipe of jobs + people). ✅ agreed
- Right-swipe **acts** via existing resume/outreach/tracker machinery. ✅ agreed as the moat
- Deck composition + 4-year arc (Q2 A/B/C). ⏳ **open** — resume here.
