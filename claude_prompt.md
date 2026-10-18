# Claude Implementation Prompt --- Reservia Corporate Website

You are the senior frontend engineer and UI/UX designer responsible for
implementing the Reservia corporate website.

## Objective

Build a polished, production-ready, responsive corporate website for
Reservia, an integrated energy company. Use **React**, **Framer
Motion**, and the requested **H2i icon library**. Before implementation,
inspect the repository, existing assets, package manager, and any
supplied HTML/template. Treat the supplied HTML as the primary reference
for the website's required sections and content structure.

The project must look like a credible, professionally art-directed
corporate website---not a generic AI-generated landing page.

## Mandatory first steps

1.  Inspect the entire existing project structure and identify the
    current framework, entry points, scripts, dependencies, routing,
    assets, and conventions.
2.  Find and inspect the supplied HTML/template and all relevant design
    assets. If they are available in the repository or attached
    workspace, use them as the source of truth for required sections and
    content. Do not invent replacement sections that contradict them.
3.  Read `rules.md` and `skills.md` before changing files.
4.  If the project already exists, preserve its working setup and
    conventions where practical. If it is empty, scaffold a React
    application with Vite unless there is a clear reason to use another
    existing setup.
5.  Confirm the exact icon package intended by "H2i icons" from project
    dependencies or the supplied instructions. Do not silently
    substitute a different library. If it is not identifiable or
    available, report the ambiguity and use a consistent icon
    abstraction that can be switched to the confirmed library without
    rewriting components.
6.  Write a short implementation plan and list any missing inputs that
    genuinely block implementation. Do not stop for non-blocking
    questions; use sensible, restrained defaults.

## Required technology

-   React with functional components and hooks.
-   Framer Motion for purposeful, performant motion.
-   The requested H2i icon library, after verifying the exact
    package/API.
-   Use the existing project language and build tooling if already
    established.
-   Use semantic HTML, accessible controls, responsive CSS, and reusable
    components.
-   Prefer the existing styling system if one is already configured. Do
    not add a large UI framework without a clear need.
-   Use the existing router if present; otherwise keep routing simple
    and appropriate to the scope.

## Website scope

Use the supplied HTML/template to establish the exact sections. The
known business requirements are:

-   A bilingual **Arabic/English** corporate website.
-   Three business vertical landing pages: **Villas**, **Compounds**,
    and **Agriculture**.
-   Lead/enquiry forms.
-   WhatsApp contact integration.
-   CRM integration for lead capture.
-   Meta Pixel and Conversions API (CAPI) readiness, GA4, Google Tag
    Manager, and Google Ads conversion tracking readiness.
-   On-page and technical SEO foundations, with local SEO
    considerations.
-   Mobile-first responsive layouts.
-   Production and staging deployment readiness.
-   HTTPS and secure handling of form submissions and secrets.

Implement the shared navigation, footer, language switcher, and page
layouts in a reusable way. Preserve the reference template's content
hierarchy while improving the typography, spacing, visual polish, and
motion design.

### Bilingual behavior

-   Implement English and Arabic, including correct RTL layout in Arabic
    and LTR layout in English.
-   The language switcher must change the actual page content and
    document direction, not merely translate the button label.
-   Ensure navigation, grids, forms, icons, spacing, and motion behave
    correctly in both directions.
-   Do not machine-translate specialized company copy if approved
    Arabic/English content is supplied. If copy is missing, keep content
    easy to replace and flag placeholder text clearly.
-   Persist language only through an established project mechanism if
    one exists; do not add unnecessary persistence infrastructure.

## Design direction

Create a confident, modern, high-quality corporate identity suitable for
an energy company.

-   Start from the existing Reservia brand assets, logo, colors, and
    supplied template. Do not invent a new brand palette if official
    brand assets are available.
-   Use deliberate typography with a clear hierarchy. Choose fonts that
    support Arabic and Latin well; verify that Arabic glyphs render
    correctly.
-   Improve the template through refined typography, spacing, layout,
    image treatment, and carefully selected animations while retaining
    the required sections.
-   Favor strong composition, clear information hierarchy, restrained
    colors, high-quality imagery, and generous but purposeful spacing.
-   Avoid generic gradients, excessive glassmorphism, random blobs,
    over-rounded cards, gratuitous shadows, decorative clutter, and
    animation on every element.
-   Avoid emoji as interface icons.
-   Use the verified icon library consistently. Icons must support
    meaning and navigation, not act as decoration.
-   Do not use placeholder images from unstable URLs. Prefer supplied
    assets; otherwise use a reliable asset already in the project and
    document any temporary placeholders.

## Motion requirements

Use Framer Motion intentionally:

-   Subtle page/section entrance transitions.
-   Staggered reveals only where they help establish hierarchy.
-   Small hover/focus interactions for links, buttons, and cards.
-   Smooth mobile navigation transitions.
-   Respect `prefers-reduced-motion`.
-   Avoid scroll hijacking, long blocking intro animations, excessive
    parallax, and animations that delay access to content.
-   Keep motion performant and prevent layout shifts.

## Lead forms and CRM integration

Implement form UI and client-side validation, but do not pretend that a
real backend integration exists if the endpoint or credentials have not
been supplied.

-   Create a clearly isolated API/service layer for lead submission.
-   Read API URLs and configuration from environment variables.
-   Never place secrets, private tokens, or CRM credentials in
    client-side code.
-   Validate required fields and email/phone formats appropriately.
-   Provide loading, success, validation-error, and server-error states.
-   Prevent duplicate submissions while a request is pending.
-   Include accessible labels and useful error messages.
-   Add basic client-side spam friction only if appropriate; server-side
    validation, rate limiting, and spam controls must be handled by the
    backend.
-   If no backend endpoint is available, build a documented adapter/mock
    mode that is unmistakably marked as non-production. Do not falsely
    display a success state for a submission that was not delivered.
-   Capture campaign/UTM data where appropriate and pass it through the
    agreed integration contract.
-   Confirm the expected payload and endpoint with the existing
    backend/API docs if available.

## WhatsApp integration

-   Use an official business number supplied by the project owner; never
    invent a number.
-   Build the contact link from a single configurable value.
-   Use a clear accessible label and appropriate external-link behavior.
-   Do not send form data to WhatsApp automatically without the user's
    clear action.

## SEO, analytics, and security

-   Add meaningful page titles, descriptions, canonical handling where
    applicable, semantic headings, descriptive image alt text, and
    social sharing metadata.
-   Ensure pages can be indexed and that language variants use
    appropriate language metadata and, where applicable, hreflang.
-   Add analytics integration points through environment/configuration
    values. Do not invent measurement IDs or claim events are being
    tracked without valid configuration.
-   Avoid exposing private enquiry data in URLs, logs, static files, or
    public client bundles.
-   Keep environment files out of version control and provide a safe
    `.env.example` with placeholder values only.
-   Do not implement security controls in the frontend as a substitute
    for server-side protections.

## Quality and accessibility

-   Test common viewport widths, including small mobile, tablet, laptop,
    and large desktop.
-   Check both Arabic RTL and English LTR.
-   Ensure keyboard navigation, visible focus indicators, accessible
    names, form labels, contrast, and reduced-motion behavior.
-   Use responsive images and avoid unnecessary large dependencies.
-   Handle loading, empty, error, and success states where applicable.
-   Keep components focused and reusable; avoid one giant page
    component.
-   Remove dead code and unused dependencies only when it is safe to do
    so.

## Safety rules for modifying the codebase

-   **Do not destroy, rewrite, or restructure unrelated code.**
-   Do not delete existing files or assets unless you can prove they are
    unused and the change is necessary.
-   Do not overwrite existing environment files, project configuration,
    lockfiles, or scripts without first understanding their purpose.
-   Do not make unrelated backend, ERP, CRM, deployment, or database
    changes.
-   Keep changes scoped to the website and necessary integration
    adapters.
-   Before editing an existing file, understand its role and current
    behavior.
-   Do not use fake data as though it were live production data.
-   Do not commit or push changes unless explicitly asked.
-   If you discover a blocker, explain it and implement the safe portion
    rather than guessing at secrets, URLs, brand assets, or business
    rules.

## Implementation workflow

1.  Inspect repository and supplied template.
2.  Read `rules.md` and `skills.md`.
3.  Summarize the existing setup and proposed approach.
4.  Establish design tokens and global typography, colors, spacing,
    breakpoints, and direction handling.
5.  Build reusable shell components: header, navigation, language
    switcher, footer, and shared CTAs.
6.  Implement the required pages and sections from the reference HTML.
7.  Implement responsive layouts and accessible motion.
8.  Implement lead forms, CRM service adapter, and WhatsApp contact
    configuration.
9.  Add SEO and analytics integration points.
10. Run the available lint, typecheck, tests, and production build
    scripts.
11. Fix issues introduced by your changes.
12. Manually review key pages in English and Arabic at desktop and
    mobile sizes if browser tooling is available.
13. Summarize changed files, completed work, environment variables
    required, integration assumptions, test/build results, and any
    remaining blockers.

## Definition of done

-   The website builds successfully using the project's documented
    commands.
-   All required reference sections are present and content hierarchy is
    preserved.
-   The design is cohesive, polished, and responsive.
-   English LTR and Arabic RTL work correctly.
-   Framer Motion interactions are purposeful and respect reduced-motion
    preferences.
-   The exact icon library has been verified or its ambiguity clearly
    reported.
-   Forms have robust UI states and do not falsely claim delivery.
-   CRM, WhatsApp, analytics, and tracking are configurable and do not
    expose secrets.
-   SEO and accessibility basics are implemented.
-   No unrelated code has been changed or destroyed.
-   The final report clearly separates implemented functionality from
    integrations awaiting credentials, endpoints, or external setup.

Begin by inspecting the existing repository and the supplied
HTML/template. Do not start by replacing the entire codebase.
