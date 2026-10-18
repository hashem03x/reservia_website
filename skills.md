# Reservia Website --- `skills.md`

Use the following design and implementation skill guidance throughout
the project. If the execution environment has actual `frontend-design`
or `ui-ux-pro-max` skill files installed, read and follow those files as
well. This document provides project-specific requirements and does not
claim to install external skills.

## Skill 1: `frontend-design`

### Goal

Deliver an intentionally art-directed, production-quality corporate
website with a coherent visual identity, strong responsive behavior, and
maintainable React architecture.

### Before designing

-   Inspect the reference HTML, existing website, official Reservia
    logo, colors, fonts, and supplied assets.
-   Identify the company's audience, key services, primary conversion
    goal, and required page sections.
-   Establish a small design system before building individual pages.
-   Avoid designing from generic landing-page patterns without reference
    to Reservia's identity.

### Visual system

-   Define reusable design tokens for colors, typography, spacing,
    content widths, radii, borders, shadows, and breakpoints.
-   Use brand colors from verified assets or supplied specifications. Do
    not guess official colors if source material exists.
-   Select readable Arabic and Latin typefaces and verify glyph coverage
    and line-height in both languages.
-   Establish a clear type scale and consistent heading/body
    relationships.
-   Use a restrained, purposeful grid and consistent alignment.
-   Ensure imagery supports the actual business and does not imply
    unverified projects, customers, or capabilities.
-   Keep buttons, links, forms, navigation, and cards visually consistent.

### Layout and responsive implementation

-   Build reusable React components instead of a single monolithic page.
-   Use mobile-first CSS and test narrow screens early.
-   Prevent horizontal overflow, clipped Arabic text, and broken
    navigation.
-   Treat the desktop and mobile navigation as intentional experiences.
-   Preserve the supplied HTML's required sections and content
    hierarchy.
-   Keep content readable and conversion paths obvious.

### Motion

-   Use Framer Motion for transitions that clarify hierarchy or state.
-   Prefer subtle entrance, hover, and navigation transitions.
-   Respect reduced-motion preferences.
-   Avoid long intro sequences, scroll hijacking, excessive parallax,
    and animation that delays interaction.
-   Avoid layout shifts and keep animation performant.

### Engineering quality

-   Use semantic HTML and accessible interactions.
-   Keep components, styles, content, and integration services separated
    where useful.
-   Reuse existing project conventions.
-   Avoid unnecessary dependencies, duplicated CSS, dead code, and
    overengineering.
-   Verify production build and existing checks before declaring
    completion.

## Skill 2: `ui-ux-pro-max`

### Goal

Apply a systematic UI/UX review process so that the website is clear,
trustworthy, accessible, and conversion-focused across desktop and
mobile.

### UX principles

-   Make the primary action clear on every relevant page.
-   Keep navigation labels concise and predictable.
-   Use consistent terminology across English and Arabic.
-   Design complete interaction states: default, hover, focus, active,
    disabled, loading, success, validation error, and server error as
    relevant.
-   Reduce unnecessary form fields and explain why required information
    is needed.
-   Keep forms usable on touch devices and ensure validation messages
    are associated with their fields.
-   Use clear success/failure feedback without falsely implying a lead
    was delivered.
-   Ensure WhatsApp is an optional user-initiated contact path, not an
    automatic data-sharing mechanism.

### Bilingual and RTL usability

-   Implement actual Arabic content and `dir="rtl"` for Arabic, and
    `dir="ltr"` for English.
-   Use logical CSS properties such as `margin-inline-start`,
    `padding-inline`, and `text-align: start` where suitable.
-   Verify mirrored layouts carefully; do not mechanically reverse every
    icon or animation.
-   Ensure language switching preserves a coherent location and does not
    leave mixed-language UI.
-   Check text wrapping, mixed Arabic/Latin strings, phone numbers,
    email addresses, and form errors.

### Accessibility

-   Use semantic landmarks and logical heading order.
-   Provide keyboard support and visible focus indicators.
-   Ensure sufficient text and control contrast.
-   Add accessible names to icon-only controls.
-   Associate labels and validation messages with form inputs.
-   Respect reduced-motion settings.
-   Do not communicate important information through color alone.

### Conversion and content

-   Keep the value proposition and next step understandable.
-   Use clear calls to action that match the section's intent.
-   Use the supplied business content and avoid fabricated metrics,
    endorsements, and claims.
-   Give each vertical page---Villas, Compounds, and Agriculture---a
    clear, relevant information structure based on the supplied template
    and approved content.
-   Keep SEO titles, descriptions, semantic structure, and headings
    aligned with each page's actual content.

### Quality review checklist

Before completion, review: - English desktop and mobile. - Arabic
desktop and mobile. - Header, navigation, language switcher, and
footer. - All required sections from the reference HTML. - All lead form
states. - Keyboard navigation and focus visibility. - Reduced-motion
behavior. - Image loading and responsive cropping. - Layout overflow and
text clipping. - Broken links and missing assets. - SEO metadata and
environment configuration. - Build/test results and documented
integration blockers.

## How to apply both skills

1.  Read the actual reference and assets first.
2.  Define the design system and page structure.
3.  Build the shared responsive shell.
4.  Implement pages and interactions.
5.  Review UX and accessibility in both directions/languages.
6.  Run checks and report the evidence.

Do not use either skill as permission to replace the reference design
wholesale or to change unrelated code.
