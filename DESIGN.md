# Design Brief

## Direction

Haven — a private, calm, two-person messenger with a refined deep pine-teal + warm-neutral palette and a frosted-glass privacy lock.

## Tone

Refined privacy: quiet, premium, and trustworthy — a deep ink-teal "private channel" aesthetic that avoids loud social-messenger clichés.

## Differentiation

Asymmetric pine-teal sender bubbles with a signature tail, plus a frosted-glass lock screen that makes the privacy flow feel intentional and premium.

## Color Palette

| Token      | OKLCH (light) | OKLCH (dark) | Role                              |
| ---------- | ------------- | ------------ | --------------------------------- |
| background | 0.985 0.006 85 | 0.155 0.012 250 | app canvas                    |
| foreground | 0.18 0.015 250 | 0.93 0.008 85 | primary text                   |
| card       | 0.99 0.004 85  | 0.19 0.014 250 | surfaces, received bubbles     |
| primary    | 0.42 0.085 175 | 0.68 0.09 175 | pine-teal, sent bubbles, CTAs   |
| accent     | 0.93 0.02 85   | 0.26 0.02 250 | hover / active surfaces        |
| muted      | 0.95 0.008 85  | 0.23 0.014 250 | secondary surfaces, separators |
| destructive | 0.55 0.2 25   | 0.62 0.19 22 | decline / errors               |

## Typography

- Display: Space Grotesk — conversation header, lock-screen title, headings
- Body: DM Sans — message text, UI labels, buttons
- Mono: JetBrains Mono — timestamps, read receipts, call status
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`, label `text-xs font-semibold uppercase tracking-widest`, body `text-[15px] leading-relaxed`

## Elevation & Depth

Two-level surface hierarchy (canvas → card) with soft `shadow-subtle`/`shadow-elevated`; bubbles get `shadow-bubble`; no neon glows.

## Structural Zones

| Zone            | Background     | Border   | Notes                                        |
| --------------- | -------------- | -------- | -------------------------------------------- |
| Home / lock     | background + frosted card | border | frosted-glass privacy card, PIN entry |
| Conversation header | card       | border-b | avatar, name, online dot, call/lock actions |
| Message thread  | background     | —        | bubbles + date separators on muted pills     |
| Composer        | card           | border-t | attachment/camera/mic/call, input, send btn  |
| Incoming call   | card / elevated | border  | accept (primary) / decline (destructive)     |

## Spacing & Rhythm

Mobile-first `px-4` gutters, `space-y-1.5` between bubbles, `py-2` date separators, `gap-2` composer controls; desktop constrains thread to a centered `max-w-2xl` column.

## Component Patterns

- Buttons: `rounded-full`; primary pine-teal with `hover:brightness-105`, destructive for decline, ghost icon buttons for composer actions
- Bubbles: `rounded-2xl` with asymmetric tail; sent = primary, received = card; `max-w-[78%]`
- Badges: `rounded-full` muted pill for date separators and unread count
- Lock card: `rounded-3xl` frosted-glass with `shadow-elevated`

## Motion

- Entrance: thread messages `animate-fade-in` (0.25s), lock card `animate-slide-up` (0.3s)
- Hover: buttons `transition-smooth` brightness/bg shift
- Decorative: `typing-dot` staggered bounce, `pulse-ring` on incoming-call accept

## Constraints

- Token-only styling — no raw hex/rgb in components
- AA+ contrast in light and dark; never rely on opacity for legibility
- Mobile-first, desktop `max-w-2xl` thread; no full-page gradients
- No visual zones for doNotBuild features (push, video, voice msgs, disappearing, settings, last-seen, edit, E2E, pinning/export)

## Signature Detail

The asymmetric pine-teal sender bubble with a crisp tail — a calm, unmistakable "private channel" mark that carries the whole identity.
