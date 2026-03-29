# Presenter Notes
**"Practical Vibe Coding & Vibe Design — How AI Enhances Modern Product Development"**

Audience: Mixed — some technical, mostly non-technical. Salesforce ecosystem. People curious about AI but haven't shipped anything with it yet.
Format: 60–75 min total. Slides + live demo + live build. Heavy on practical, light on theory.

---

## BEFORE YOU START

Open these in advance, minimized and ready to switch:
- Browser tab: OrgBlueprint app (localhost:3000 or live URL)
- VS Code / Claude Code: the project, already loaded
- A blank chat with Claude or Claude Code

Your phone: silent. Water on the table. Timer running quietly.

---

## Slide 1 — Title

**Headline:** Practical Vibe Coding & Vibe Design
**Subhead:** How AI Enhances Modern Product Development

**Say:**
> "Hi everyone. I'm Naveen. I work in sales. And I built a production-grade SaaS application — with AI as my co-developer. Today I want to walk you through not just what I built, but exactly how the process worked. Because I think that's the part that actually matters for you."

**Tone:** Don't undersell. You shipped a real thing. Be confident.

---

## Slide 2 — The Real Shift

**Headline:** The bottleneck in software is no longer writing code.

**Say:**
> "For decades, the bottleneck in building software was writing the code. That's changing. Fast.
>
> The new bottleneck is knowing what to build. Communicating it clearly. Making decisions quickly. Iterating without fear.
>
> And that's a shift that benefits everyone in this room — not just developers."

**Key point:** Frame this for non-developers. They're not excluded from this era. They're actually better positioned than they think.

---

## Slide 3 — Two Terms You'll Hear Today

**Two columns:**

**Vibe Coding**
> Describe what you want in plain language. AI writes it. You review, correct, and direct.

**Vibe Design**
> Describe the experience, the feeling, the user journey. AI structures it, generates the UI, catches gaps you missed.

**Say:**
> "These aren't just buzzwords. They're a real shift in how products get built. And today you're going to watch both happen live.
>
> The important word in both is 'vibe' — because you're working from intent and instinct, not from a formal spec. AI helps you make the instinct concrete."

---

## Slide 4 — Where This Came From (Personal Story)

**Headline:** A sales problem. A weekend. No team.

**Say:**
> "Here's where OrgBlueprint came from. I work in sales, and I kept seeing the same thing — customers asking 'what Salesforce products do we need?' and the answer taking weeks. Multiple handoffs. Multiple calls. Multiple people.
>
> The information to answer that question already existed. The bottleneck was time and access.
>
> So instead of waiting for someone else to fix it, I tried to fix it myself. No budget. No engineering team. Just a weekend, a clear idea, and a really good AI."

**This is your credibility slide.** Be honest. The audience needs to believe this is real and repeatable — not a flex.

---

## Slide 5 — The Full Product Development Stack

**Visual:** A vertical pipeline with 5 layers, each labeled:

```
  IDEA
    ↓
  DESIGN  (user experience, flows, component specs)
    ↓
  CODE  (features, logic, APIs, database)
    ↓
  TESTING  (unit, E2E, QA)
    ↓
  DEPLOY  (infrastructure, CI/CD, monitoring)
```

**Say:**
> "Traditional product development has five layers. Each one used to require a different specialist. A designer. A developer. A QA engineer. A DevOps person.
>
> What I want to show you today is how AI now participates in every single one of these layers — not just the code. And how you, even without technical expertise, can direct that process."

**This is the thesis slide.** The rest of the talk proves it layer by layer.

---

## Slide 6 — Layer 1: Vibe Design

**Headline:** You don't need Figma to design.

**Say:**
> "Let me start at the top. Design.
>
> The traditional flow: have an idea → hire a designer → wait for wireframes → review → revise → hand off to dev. That cycle takes weeks and costs real money.
>
> The vibe design flow: describe the experience you want in plain language → AI gives you back structure, components, and interaction flows → you iterate in conversation → hand the spec directly to the builder.
>
> Let me show you what that actually looks like."

**[LIVE — 5 minutes]**

Open Claude or ChatGPT. Type something like:

> "I want to design a wizard that helps a sales rep describe their company's CRM needs. It should feel like a conversation with a senior consultant — warm, not robotic. Three questions max, each one building on the last answer. After the questions, show a results dashboard. Design the user flow and suggest the key UI components."

Read the output out loud as it generates. Point out:
- It structures the flow without you specifying steps
- It catches edge cases you didn't mention ("what if the user skips a question?")
- It suggests component names you can hand directly to a developer

**Say:**
> "I didn't draw a wireframe. I didn't write a spec doc. I described what I wanted to feel like — and AI gave me back a structure I could build from. That's vibe design."

---

## Slide 7 — Layer 2: Vibe Coding

**Headline:** You describe it. AI writes it. You own it.

**Say:**
> "Now the code layer. And this is where I want to be really honest with you about what this looks like in practice — because it's not magic. It's a very tight feedback loop.
>
> You describe what you want. AI writes it. You read it. You test it. You correct it. You ship it.
>
> The skill isn't typing. The skill is knowing what to ask for, and knowing when the answer is wrong."

**[LIVE — 8 minutes]**

Switch to VS Code / Claude Code. Show a real moment from the OrgBlueprint codebase. Good options:

**Option A (simpler):** The AI fallback chain in `apps/web/src/lib/anthropic.ts`
> "I said: never let the UI hang if one AI provider is down. AI designed this entire try/catch fallback chain — Gemini → deterministic — from that one sentence."

**Option B (more visual):** The conversation wizard in `ConversationChat.tsx`
> "I described the six-stage wizard in plain English. AI built the state machine. I reviewed and corrected it."

Show the code briefly, then say:
> "I didn't write this line by line. I described the behavior. I reviewed what came back. I corrected where it was wrong. The decisions are mine. The typing is AI's."

---

## Slide 8 — Layer 3: Testing

**Headline:** AI writes tests that would have taken days.

**Say:**
> "Testing is the layer people skip when they're building fast. It's also the layer AI is particularly good at.
>
> I described what OrgBlueprint should do — what the wizard flow looks like, what the API should return, what the dashboard tabs should contain — and AI generated a full Playwright E2E test suite from that description.
>
> Not just unit tests. End-to-end tests that open a browser, type into the form, click through the wizard, and verify the dashboard renders correctly."

**Show briefly (30 seconds):** `apps/web/tests/e2e/demo-mode.spec.ts`

> "This file tests the full user journey. AI wrote it. I reviewed it. It runs on every deploy. That's a quality gate I would not have had time to build manually."

---

## Slide 9 — Layer 4: Deploy & Infrastructure

**Headline:** Infrastructure is now a prompt, not a config.

**Say:**
> "Vercel deployment, environment variables, database migrations, PM2 process management for local dev — all of this infrastructure was set up with AI assistance.
>
> I didn't know every Vercel config option. I described what I needed: 'This is a Next.js monorepo, the core package needs to build first, the web app imports from dist.' AI gave me the config. I deployed.
>
> This layer used to require a dedicated DevOps engineer. For a project this size, it's now a conversation."

---

## Slide 10 — OrgBlueprint: The Evidence

**Headline:** Here's what this process produced.

**Say:**
> "So let me show you the artifact. Not as a demo — you've already seen how the parts were built. But as evidence that this process produces something real."

**[LIVE DEMO — 5 minutes, tight]**

1. Open the app
2. Type: *"50-person B2B SaaS company, inside sales team, need pipeline visibility and customer onboarding automation"*
3. Run in Demo mode — show the speed (instant result)
4. Click through 3–4 dashboard tabs, naming each: "Product recommendations. Cost estimate. Technical blueprint. Phased roadmap."
5. Show the floating AI chat widget — ask it one question about the blueprint
6. That's it. Don't over-demo.

**Say:**
> "Rules engine, AI conversation layer, cost calculator, E2E tests, database, auth, PDF export, chat widget — built by one person, in a weekend, using the process I just walked you through."

---

## Slide 11 — The Honest Part

**Headline:** What AI can't do.

**Say:**
> "I want to be honest with you, because the hype around this is real and so are the limits.
>
> AI doesn't have your judgment. It doesn't know your customers. It doesn't know which tradeoffs matter to your business. It gets things wrong — sometimes confidently wrong.
>
> The skill of vibe coding and vibe design is not 'prompt it and forget it.' It's knowing what good looks like so you can catch what's bad.
>
> You're still the decision-maker. AI is the execution layer. The moment you stop reviewing — that's when you get burned."

**This builds trust.** The audience will appreciate the honesty far more than pure enthusiasm.

---

## Slide 12 — Live Build (The Highlight of the Session)

**Headline:** Let's build something. Right now.

**Say:**
> "I want to end the structured part of this session with something different. I'm going to take a feature request — from you, from this room — and build it live. In Claude Code. Right now.
>
> It won't be perfect. It might break. That's the point — you should see what the actual process looks like, not a polished recording."

**Ask the room:** "What do you want to add to this app?" or have a pre-planted simple request ready:
- "Add a 'Share this blueprint' button that copies a link"
- "Add a confidence score to each product recommendation"
- "Show a loading skeleton instead of just a spinner"

**Do it live.** Show:
1. Describing the feature to Claude Code in plain English
2. Reviewing what it generates
3. Correcting one thing
4. Showing it work in the browser

**If it breaks:** "This is the real process. Let me fix it." Fix it. Move on. The audience respects this more than perfection.

**Time box:** 12–15 minutes max. Even a partial build is powerful.

---

## Slide 13 — What You Can Do Tomorrow

**Three bullet points only:**

1. **Before writing (or asking someone to write) code** — describe the feature to Claude and ask it to find gaps in your thinking
2. **When designing something** — describe the feeling and user journey, not just the layout
3. **When stuck** — explain the problem out loud to AI. The act of explaining usually surfaces the answer

**Say:**
> "These are not advanced AI techniques. These are starting points. The compounding happens when you make this a habit — when every new idea gets pressure-tested by AI before it gets expensive.
>
> Start with one of these three. This week."

---

## Slide 14 — The Bigger Picture

**Headline:** This changes who gets to build.

**Say:**
> "I want to leave you with this.
>
> For a long time, the ability to build software was gatekept behind a very specific kind of training. You needed to know the syntax. The frameworks. The tooling.
>
> That gate is open now. Not gone — you still need to think clearly, communicate precisely, and know when something is wrong. But the technical barrier is dramatically lower.
>
> I work in sales. I built a production application. Not a prototype — a real app, with auth, a database, AI integration, end-to-end tests, and a live deployment.
>
> If I can do this, the question isn't 'can you?' The question is 'what are you waiting for?'"

**Slow down on the last line.** Pause before saying "what are you waiting for."

---

## Slide 15 — Thank You / Q&A

**Say:**
> "Thank you. I'm happy to take any questions — technical, completely non-technical, or just 'where do I even start?' That last one is my favorite."

**Smile. Stop talking. Let the silence invite questions.**

---

## Q&A Cheat Sheet

Keep this open on your phone or a second screen.

| Question | Answer |
|---|---|
| How long did it take? | Working prototype: a weekend. Production quality: a few more sessions over 2–3 weeks. |
| What AI tool did you use? | Claude Code — it's a coding agent with full codebase context. Different from ChatGPT. |
| Do you need to know how to code? | Not deeply. But you need to know what correct looks like. Start building and that knowledge comes fast. |
| What if AI gives wrong code? | It will. You review it. That's the job now — directing and reviewing, not writing every line. |
| Is it safe to use AI for production code? | Review everything. Never paste API keys or sensitive data into a prompt. Use env vars. |
| Where do I start? | Pick the smallest, lowest-stakes thing on your plate. Build a version of it with Claude this week. |
| Isn't this going to replace developers? | It replaces tasks, not judgment. Developers who use AI well will outpace those who don't. |
| What was the hardest part? | Knowing when to stop and re-think the prompt vs. keep iterating on a bad direction. |

---

## Timing Guide

| Section | Slide(s) | Time |
|---|---|---|
| Opening + framing | 1–5 | 10 min |
| Vibe Design live | 6 | 8 min |
| Vibe Coding live | 7 | 10 min |
| Testing + Deploy | 8–9 | 5 min |
| App demo | 10 | 5 min |
| Honest limits | 11 | 3 min |
| Live build | 12 | 15 min |
| Closing + Q&A | 13–15 | 10 min |
| **Total** | | **~65 min** |

---

## Delivery Rules

| Rule | Why |
|---|---|
| Never apologise for not being a developer | That's the whole point of the talk |
| Show real code, don't explain every line | The goal is "I get what's happening" not "I understand every syntax" |
| If the live build breaks, narrate the fix | "This is what real vibe coding looks like" |
| Keep the app demo under 5 minutes | Attention drops fast on product demos |
| End on Slide 14, not on Q&A | Stronger emotional close |
| Ask for questions by type: "technical, non-technical, or where do I start" | It lowers the barrier to ask |

---

*Updated for "Practical Vibe Coding & Vibe Design — How AI Enhances Modern Product Development"*
*Presenter: Naveen*
