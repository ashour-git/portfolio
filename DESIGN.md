---
name: Mohamed Ashour
description: An observatory plate of one engineer's universe, where machine perception locks onto its subject.
colors:
  void-black: "#050505"
  void-black-2: "#0a0a0a"
  plate-black: "#070707"
  panel-black: "#0d0d0e"
  panel-black-2: "#151516"
  hairline: "#262627"
  hairline-strong: "#3d3d40"
  engraving-white: "#ecebe6"
  engraving-soft: "#b8b7b1"
  engraving-faint: "#8b8a85"
  network-blue: "#5b95ff"
  network-blue-glow: "#d6e4ff"
  spacetime-magenta: "#ff3fa4"
  detection-red: "#ff3b30"
  horizon-gold: "#ffbf5e"
  cursor-green: "#a8f07e"
  paper: "#ededea"
  paper-2: "#e5e5e1"
  paper-panel: "#f7f7f4"
  paper-hairline: "#d2d2cd"
  paper-hairline-strong: "#a8a8a2"
  print-ink: "#0b0b0c"
  print-ink-soft: "#35353a"
  print-ink-faint: "#5b5b60"
  print-blue: "#1f57d6"
  print-gold: "#9a5b00"
typography:
  display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(3rem, 7.4vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.25rem, 4.8vw, 3.9rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "1.9rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  lead:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  numeral:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
    fontFeature: "\"tnum\""
rounded:
  none: "0px"
  xs: "1px"
  sm: "2px"
  lg: "3px"
  max: "4px"
spacing:
  gutter-mobile: "1.25rem"
  gutter-desktop: "2.5rem"
  container: "76rem"
  section-mobile: "5rem"
  section-desktop: "6rem"
  plate-inset: "6px"
components:
  button-primary:
    backgroundColor: "{colors.engraving-white}"
    textColor: "{colors.void-black}"
    rounded: "{rounded.none}"
    padding: "0.85rem 1.25rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.network-blue}"
    textColor: "{colors.void-black}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.engraving-white}"
    rounded: "{rounded.none}"
    padding: "0.85rem 1.25rem"
    height: "2.75rem"
  ask-prompt:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.engraving-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.85rem 0.25rem"
  plate:
    backgroundColor: "{colors.plate-black}"
    textColor: "{colors.engraving-white}"
    rounded: "{rounded.none}"
  plate-caption:
    textColor: "{colors.engraving-soft}"
    typography: "{typography.label}"
    padding: "0.65rem 1rem"
  detection-box:
    backgroundColor: "transparent"
    textColor: "{colors.engraving-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
  readout:
    textColor: "{colors.engraving-white}"
    typography: "{typography.numeral}"
    padding: "1.75rem 2rem"
---

# Design System: Mohamed Ashour

## Overview

**Creative North Star: "The Observatory Plate"**

The page is a printed science plate of one engineer's universe: engraved white linework on true black, captioned figures, instrument annotations in the margins, and a machine-vision overlay that locks onto its subject. Every visual either is the mechanism or shows it. The black hole is ray traced live; the project figures draw the actual algorithms (attention, retrieval, landmarks, routing); the numbers come from repositories with tests in CI.

Density is editorial and sparse. Sections breathe on a 76rem shell, headlines are set like the title block of a 19th-century plate, and colour is rationed by job rather than spread as decoration. The world refuses the near-black-plus-one-neon developer template and the green cassette CRT it replaced: green survives only as the blinking terminal cursor.

The light theme is not a new palette. It is the same plate printed in ink on paper: paper ground, near-black ink, a deeper print blue. Figures (plates, the hero, the memory map, code blocks) stay engraved white on black in both themes, the way a photographic plate is still black when bound into a white book.

**Key Characteristics:**
- True black ground, warm-white engraved hairlines, no gradients behind content.
- Colour by role: blue data, magenta spacetime, red detection, gold the black hole, green the cursor.
- Three voices: Bodoni Moda headlines, Atkinson Hyperlegible prose, JetBrains Mono for measurement.
- Plates: hairline frame, registration corners, "Fig. N" captions numbered by the page.
- Square corners; depth by tone and line, not shadow.
- One authored lock-on per load; everything else is ambient and pauses or stops.

## Colors

A monochrome engraving with five role colours, each assigned one job and forbidden every other.

### Primary
- **Network Blue** (#5b95ff dark / Print Blue #1f57d6 light): networks, data, links, focus rings, text selection, the primary button's hover, the "now" marker on the career log, and the data a model attends to inside project figures. It is the only interactive colour.
- **Network Blue Glow** (#d6e4ff): the pulse travelling along network edges and the highlighted label in the memory map. Always a highlight of blue, never a separate hue.

### Secondary
- **Detection Red** (#ff3b30): computer-vision detection only. Bounding boxes, their square label pips, dashed trajectories between detections, and CV detections inside project figures.
- **Spacetime Magenta** (#ff3fa4): spacetime wireframes only. The funnel under the black hole and the wormhole diagram behind the stack.

### Tertiary
- **Horizon Gold** (#ffbf5e dark / Print Gold #9a5b00 light): the black hole only. Its photon ring, the code that heats from white to gold as it falls, and the horizon in the brand mark.
- **Cursor Green** (#a8f07e): the terminal cursor and caret only. The prompt glyph and the ask box caret.

### Neutral
- **Void Black** (#050505): page ground in dark mode and the permanent ground of every figure.
- **Plate Black** (#070707): inside a plate frame, one step off the void so the frame reads.
- **Panel Black** (#0d0d0e, #151516): raised panels and terminal blocks.
- **Hairline** (#262627) and **Hairline Strong** (#3d3d40): rules, dividers, input and ghost-button borders.
- **Engraving White** (#ecebe6): ink. Warm, never pure white.
- **Engraving Soft** (#b8b7b1): secondary prose, leads, labels on plates.
- **Engraving Faint** (#8b8a85): metadata, captions, rails, icons at rest.
- **Paper** (#ededea, #e5e5e1, #f7f7f4) with **Print Ink** (#0b0b0c, #35353a, #5b5b60) and paper hairlines (#d2d2cd, #a8a8a2): the light-theme printing of the same roles.

### Named Rules
**The One Job Rule.** Each role colour has exactly one job. Red on anything that is not a detection, magenta on anything that is not a spacetime wireframe, gold on anything that is not the black hole, green on anything that is not the cursor: each is a bug.

**The Emitted Light Rule.** Role colours are light emitted inside a figure, so their values are identical in both themes inside plates and the hero. Only blue and gold have print counterparts, and only for page-level UI on paper.

**The Warm Ink Rule.** Ink is #ecebe6, never #ffffff; ground is #050505, never a tinted navy or grey.

## Typography

**Display Font:** Bodoni Moda (with Bodoni 72, Didot, Georgia)
**Body Font:** Atkinson Hyperlegible Next (with ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** A high-contrast modern serif from the age of engraved science plates sets the titles; a legibility-first sans carries prose so identifiers like GPT-4o and l/1/I stay unambiguous; mono is the instrument's voice, reserved for things that are measured.

### Hierarchy
- **Display** (900, clamp(3rem, 7.4vw, 6rem), 0.88, uppercase): the name in the hero, one line per word. Nowhere else.
- **Headline** (600, clamp(2.25rem, 4.8vw, 3.9rem), 1.02): section titles, balanced, held to 18-22ch.
- **Title** (600-700, 1.5rem to 4.5rem, tight): project and role names; the flagship project goes to 700 at 4.5rem; the employer clause after a role is set italic in Engraving Soft.
- **Body** (400, 1.0625rem, 1.6): prose, held to 54-68ch, pretty-wrapped.
- **Lead** (400, 1.125rem, 1.6, Engraving Soft): the single paragraph under a section headline, max 56ch.
- **Numeral** (800, 1.5rem to 2.5rem, tight tracking, tabular): measured results in readouts.
- **Label** (500, 0.6875rem to 0.8125rem, 0.05-0.06em, uppercase inside plates): plate captions, coordinates, detection tags, instrument annotations, stack lists, periods.

### Named Rules
**The Measurement Rule.** Mono appears only for code, coordinates, scores, numerals, periods and instrument annotations. Never for prose, headings or buttons.

**The Plate Title Rule.** Headlines are Bodoni Moda. The name alone is 900 capitals; every other headline is 600-700 in sentence case.

**The No Kicker Rule.** Nothing sits above a headline. No eyebrow, no section number, no category tag; captions belong to figures, not to sections.

## Layout

A single centred shell (max 76rem) with 1.25rem gutters, 2.5rem from 768px. Sections stack vertically with 5rem block padding, 6rem from 768px, each opening with headline then lead, then its figure or list.

The first viewport splits on wide screens (from 1024px): identity in the left 40% (name, role line, ask prompt, resume button, two text links), the black hole occupying the right 60% at centre (70%, 47%) under a 100svh section. Below 1024px the hole becomes a 40svh band above the identity, centred at (50%, 56%), and margin annotations are hidden.

Readouts are three equal columns between top and bottom hairlines, separated by vertical hairlines rather than gaps. Project figures pair two-up on large screens; secondary projects run two columns, with an odd last card spanning the row. Ambient diagrams sit behind sections, offset to the right edge, hidden below 768px. Under 480px a plate caption keeps only its first span so the figure stays one line.

## Elevation & Depth

Flat by construction. Depth comes from tone (void, plate, panel steps), hairlines, and `mix-blend-mode: screen` for light layered over light in the hero (network, spacetime funnel). Masks fade the hero's canvases into the identity column instead of hard edges. Glow exists only as emitted light: a drop-shadow on blue network pulses and active memory stars, never on boxes.

### Named Rules
**The Engraved Depth Rule.** Surfaces never cast shadows. A plate is separated from the page by its hairline frame and one tonal step, not by elevation.

## Shapes

Square. Buttons, inputs, plates, detection boxes and readouts have no radius; the token scale caps at 4px and is used only for small incidental corners. Circles appear only as data (network nodes, orbit bodies, the career-log nodes, stars). Lines are 1px hairlines; glyphs and network edges are 1.5px strokes with round caps; ambient axes are 2-6 dashes; detection trajectories are 3-6 dashes.

Registration corners are the recurring silhouette: 9px arms at 6px inset on plates, 14px arms on the larger HUD bracket around the observer portrait.

## Components

### Buttons
Blunt, printed, confident.
- **Shape:** square corners (0px), 2.75rem minimum height.
- **Primary:** Engraving White fill with Void Black text, Atkinson 700 at 0.9375rem, padding 0.85rem 1.25rem, optional 18px bold icon leading.
- **Hover / Focus:** fill and border become Network Blue; 2px blue outline at 3px offset on focus-visible; 1px press-down on active.
- **Ghost:** transparent with Hairline Strong border; hover lifts the border to ink.
- **Text links:** Engraving Soft with a Hairline Strong underline at 6px offset; hover turns text and underline blue.

### Ask Prompt (input)
A terminal line that asks the copilot.
- **Style:** square, 1px Hairline Strong border, ground fill, mono throughout; a prefix with the green prompt glyph, a green caret, and a send button separated by a hairline.
- **Focus:** the border turns Network Blue; the send button fills blue on hover or focus.

### Plates (cards / figures)
- **Corner Style:** square, with registration corners at 6px inset (rgba(236,235,230,0.55)).
- **Background:** Plate Black in both themes; ink is Engraving White.
- **Border:** 1px rgba(236,235,230,0.14).
- **Caption:** a mono uppercase bar (0.72rem, 0.06em) under a hairline, beginning "Fig. N" from a page counter, title left, metadata right.
- **Content:** SVG figures in the plate vocabulary: white strokes, dim strokes at 26%, blue for attended data, red for detections, uppercase mono labels.

### Detection Box (signature)
The site's signature: a vision model acquiring its targets.
- **Style:** 1px Detection Red box, no fill; a tag above-left in mono 0.75rem preceded by a 6px red square, reading `label 0.97`; live `x: y:` coordinates below-right in tabular mono at 70% ink; both labels sit on a 72% black chip over bright content.
- **Motion:** in the hero, two boxes hunt and lock onto the black hole and the name in 1.15s with an overshooting cubic-bezier(0.16, 1, 0.3, 1), confidence climbing and coordinates settling on real pixel centres; a dashed red trajectory then traces between them over 0.9s. Once per load. Reduced motion shows the locked state at once. On the portrait the box re-locks on hover in 0.42s.

### Readout
Measured results as an instrument strip: three columns between hairlines, numeral in mono 800, label in prose below, source repository as a faint mono link that turns blue on hover.

### Career Log
A git log: a 1px faint rail with hollow 0.75rem ink nodes; the current role's node fills blue and carries a mono "now".

### Navigation
Sans 15px links in Engraving Soft, ink on the active section, a surface-hover tint on keyboard focus; the brand mark (three blue inputs converging on a gold horizon) leads. Over the hero it uses dark tokens in both themes.

### Ambient Diagrams
Engraved diagrams (Lorenz attractor, orbit chart, wormhole) behind sections at 26% (magenta wormhole 62%, attractor 45%). Lines draw once when scrolled into view over 3.6s (9s for slow paths), then orbits drift on a 200s rotation. Without JS they render fully drawn; with reduced motion they render drawn and still.

### Hero Motion
The code stream spirals real code into the horizon on canvas, white heating to gold and stretching as it falls, paused when offscreen or the tab is hidden, one still frame under reduced motion. Spacetime rings fall into the funnel on a 10s loop; network pulses flow on 4.5s. Each has a reduced-motion path.

**The Two Canvas Rule.** Hero motion lives on exactly two surfaces: the ray-traced black hole (WebGL, `black-hole.tsx`: a reduced-resolution field plus a screen-resolution core feathered over it, resolution adapting both ways to hold vsync) and one 2D canvas (`infall.tsx`: starfield, funnel, network, code; static parts cached once, glyphs stamped from a sprite sheet). No animated SVG, CSS filter, mask or blend mode in the hero: each one repaints a full layer per frame and, measured on an Intel UHD 630, cost the page from 60 fps down to 8. Ledger: `docs/perf/2026-11-17-hero.md`.

## Do's and Don'ts

### Do:
- **Do** assign colour by role: blue #5b95ff for networks, data, links and focus; magenta #ff3fa4 for spacetime wireframes; red #ff3b30 for CV detection; gold #ffbf5e for the black hole; green #a8f07e for the terminal cursor.
- **Do** keep the ground true black (#050505) and the ink warm white (#ecebe6); print the light theme as #0b0b0c ink on #ededea paper with #1f57d6 blue.
- **Do** frame every figure as a plate: hairline border, registration corners, a "Fig. N" caption from the CSS counter.
- **Do** set headlines in Bodoni Moda, the name in 900 capitals, and reserve JetBrains Mono for code, coordinates, scores and numerals.
- **Do** give every animation a reduced-motion path and pause continuous motion offscreen.
- **Do** keep detection labels readable over bright content with a dark label chip.

### Don't:
- **Don't** place kickers, eyebrows, section numbers or category tags above headings.
- **Don't** use red, magenta, gold or green outside their single role, and don't add a sixth accent.
- **Don't** add drop shadows, rounded cards or gradient panels; depth is tone and hairline.
- **Don't** set prose, headings or buttons in mono.
- **Don't** play the lock-on more than once per load or add a second authored animation competing with it.
- **Don't** use pure white (#ffffff) ink or a tinted ground on the dark plate.
