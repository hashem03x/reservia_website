# Reservia Website --- `rules.md`

These rules are mandatory for all work on the Reservia website.

## 1. Protect the existing project

-   Inspect the repository before making changes.
-   Do not destroy, rewrite, or restructure unrelated code.
-   Do not delete files, assets, scripts, configuration, or dependencies
    without verifying that they are unused and that removal is
    necessary.
-   Preserve existing package manager, lockfile, scripts, routing,
    linting, and formatting conventions whenever practical.
-   Keep changes scoped to the corporate website and its explicitly
    required integration adapters.
-   Do not modify ERP, CRM backend, HR backend, databases, or production
    configuration unless explicitly authorized and necessary for the
    agreed website integration.
-   Never commit, push, deploy, or run destructive commands unless
    explicitly instructed.
-   If uncertain, inspect and explain before changing.

## 2. Follow the reference

-   Treat the supplied HTML/template and official Reservia assets as the
    source of truth for the required website sections and brand
    identity.
-   Preserve required content and information hierarchy while improving
    presentation.
-   Do not silently remove sections or invent business claims,
    statistics, client logos, certifications, addresses, phone numbers,
    or testimonials.
-   Use placeholders only when necessary, make them easy to replace, and
    identify them in the final report.

## 3. Technology and dependencies

-   Use React and Framer Motion.
-   Verify the exact package/API meant by "H2i icons" before importing
    it. Do not silently substitute a different icon package.
-   Reuse existing dependencies and styling conventions when reasonable.
-   Avoid adding dependencies for features that can be implemented
    simply with the existing stack.
-   Use functional components and hooks; keep components focused and
    reusable.

## 4. Design and UX

-   Aim for a distinctive, professional energy-company website---not a
    generic AI landing page.
-   Reuse official logo, colors, fonts, and image assets where
    available.
-   Use deliberate typography, clear hierarchy, consistent spacing,
    responsive layouts, and restrained animation.
-   Avoid gratuitous gradients, glassmorphism, excessive rounded cards,
    heavy shadows, visual clutter, and unnecessary motion.
-   Never use emoji as interface icons.
-   Respect `prefers-reduced-motion`.
-   Test Arabic RTL and English LTR, including navigation, forms,
    alignment, icons, and responsive behavior.

## 5. Integrations and security

-   Never invent production endpoints, API keys, tracking IDs, WhatsApp
    numbers, or credentials.
-   Never expose secrets in client-side code.
-   Read public configuration from environment variables and provide a
    safe `.env.example` with placeholders.
-   Keep CRM submission logic behind a dedicated service/API adapter.
-   Do not claim a lead was sent unless the configured integration
    confirms success.
-   Clearly distinguish a mock/demo adapter from a production
    integration.
-   Treat frontend validation as usability support, not a replacement
    for backend validation, rate limiting, authorization, or spam
    protection.
-   Do not expose confidential lead data in URLs, public assets, or
    client logs.

## 6. Accessibility and performance

-   Use semantic HTML, proper heading order, accessible labels, visible
    keyboard focus, and sufficient contrast.
-   Ensure interactive elements work with a keyboard and have meaningful
    accessible names.
-   Use responsive images and avoid unnecessary layout shifts.
-   Keep animations lightweight and avoid blocking access to content.
-   Provide loading, success, and error states for interactive forms.
-   Test mobile, tablet, and desktop breakpoints.

## 7. Completion and reporting

-   Run available lint, typecheck, test, and production build commands.
-   Fix issues introduced by the implementation.
-   Do not claim checks passed unless they were actually run.
-   Report changed files, important design decisions, required
    environment variables, integration assumptions, test/build results,
    and remaining blockers.
-   Keep unrelated pre-existing failures clearly separated from issues
    introduced by your work.
