# MOVE4ALL — Visual System

## Product feel

The phone UI is a training diary first: it records a person's own choices and completed demo sessions, then turns the next action into a short, explainable path. The signature is a thin cyan route line that makes the system's eligibility path visible without turning its recommendation into medical authority.

## Visual world

- Use the supplied fitness montage as the MOVE4ALL brand reference: black device surfaces, crisp white activity cards, saturated cyan, monumental Archivo Black headings, and compact measurement labels. Apply Apple platform conventions to the controls and navigation.
- Show the same MOVE4ALL vector mark and full wordmark in the app header, including on the phone presentation, without crowding the status content.
- Preserve the app as readable phone software. At desktop width, present it inside a titanium-edged iPhone-style frame; at phone width, let the same screen fill the viewport and respect safe areas.
- Keep navigation and tasks familiar: four named tabs, standard buttons, labeled form fields, visible back buttons, and no interaction that depends on a gesture or color alone.
- The black canvas belongs to the specified reference. White is reserved for diary tiles and primary content; cyan marks selection, progression, and the primary action. Amber describes a caution; muted text stays readable.
- Keep the expression energetic and adult. No diagnosis imagery, pity cues, body comparisons, fake exercise footage, or fabricated wellness metrics.

## Tokens

The source of truth lives in `src/styles.css` as three layers: primitive palette and scale, semantic surface/text/status aliases, and component aliases. Key dark values: canvas `#07090A`, raised `#141819`, paper `#F5F6F4`, cyan `#82F4F2`, body text `#BAC2C1`; display type Archivo Black (self-hosted from the supplied font archive) and interface type the native system stack. The Archivo Black OFL license is kept at `public/fonts/OFL.txt`. Body content remains at least 16 CSS px in the base theme. The muted body copy on the dark surface and the content copy on white tiles meet the 4.5:1 normal-text target by palette selection.

Apple's Liquid Glass belongs to floating functional controls in this interface: the tab bar and prominent control treatments. Diary and exercise cards use solid standard surfaces rather than Liquid Glass, following Apple's content-layer guidance to preserve legibility. System appearance controls light/dark colors; the profile also offers larger type, contrast, motion, and transparency preferences.

## Interaction

- Touch targets have at least 44 CSS px of height and a visible keyboard focus.
- The daily check-in produces an ephemeral session context; it never saves back to the movement profile.
- Eligibility checks are completed before ranking and explanation. User feedback only affects ranking.
- Respect `prefers-reduced-motion`, the in-app reduced-motion setting, larger type, and higher-contrast settings.
- Motion uses one short desktop introduction for the headline and phone, a bounded diary-card stagger, short press feedback, and a sliding tab selection. The phone entrance is omitted on mobile. System and in-app reduced-motion preferences remove spatial animation; selection color and focus remain visible. All information is available without animation.

## Responsive composition

Compact phone: one-column content and a floating four-destination tab bar above safe-area padding. Landscape and wider screens retain the phone screen while the presentation frame and editorial introduction sit beside it. No essential control depends on the phone frame.
