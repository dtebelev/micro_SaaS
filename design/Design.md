\---  
name: NaturoPin  
colors:  
  surface: '\#fafcd5'  
  surface-dim: '\#daddb7'  
  surface-bright: '\#fafcd5'  
  surface-container-lowest: '\#ffffff'  
  surface-container-low: '\#f4f7d0'  
  surface-container: '\#eef1ca'  
  surface-container-high: '\#e9ebc5'  
  surface-container-highest: '\#e3e5bf'  
  on-surface: '\#1a1d06'  
  on-surface-variant: '\#414940'  
  inverse-surface: '\#2f3218'  
  inverse-on-surface: '\#f1f4cd'  
  outline: '\#717970'  
  outline-variant: '\#c1c9be'  
  surface-tint: '\#386940'  
  primary: '\#0e401c'  
  on-primary: '\#ffffff'  
  primary-container: '\#285831'  
  on-primary-container: '\#98cd9b'  
  inverse-primary: '\#9ed3a1'  
  secondary: '\#586400'  
  on-secondary: '\#ffffff'  
  secondary-container: '\#d6ea5a'  
  on-secondary-container: '\#5c6900'  
  tertiary: '\#353926'  
  on-tertiary: '\#ffffff'  
  tertiary-container: '\#4c503c'  
  on-tertiary-container: '\#bec2a8'  
  error: '\#ba1a1a'  
  on-error: '\#ffffff'  
  error-container: '\#ffdad6'  
  on-error-container: '\#93000a'  
  primary-fixed: '\#baf0bc'  
  primary-fixed-dim: '\#9ed3a1'  
  on-primary-fixed: '\#002109'  
  on-primary-fixed-variant: '\#20502a'  
  secondary-fixed: '\#d9ed5d'  
  secondary-fixed-dim: '\#bdd143'  
  on-secondary-fixed: '\#191e00'  
  on-secondary-fixed-variant: '\#424b00'  
  tertiary-fixed: '\#e1e5ca'  
  tertiary-fixed-dim: '\#c5c9af'  
  on-tertiary-fixed: '\#191d0d'  
  on-tertiary-fixed-variant: '\#444935'  
  background: '\#fafcd5'  
  on-background: '\#1a1d06'  
  surface-variant: '\#e3e5bf'  
typography:  
  headline-lg:  
    fontFamily: Playfair Display  
    fontSize: 3.4rem  
    fontWeight: '700'  
    lineHeight: '1.1'  
    letterSpacing: \-0.02em  
  headline-lg-mobile:  
    fontFamily: Playfair Display  
    fontSize: 2.25rem  
    fontWeight: '700'  
    lineHeight: '1.1'  
  headline-md:  
    fontFamily: Playfair Display  
    fontSize: 2.25rem  
    fontWeight: '700'  
    lineHeight: '1.15'  
  headline-sm:  
    fontFamily: Playfair Display  
    fontSize: 1.25rem  
    fontWeight: '700'  
    lineHeight: '1.25'  
  body-lg:  
    fontFamily: Inter  
    fontSize: 1rem  
    fontWeight: '400'  
    lineHeight: '1.7'  
  body-sm:  
    fontFamily: Inter  
    fontSize: 0.75rem  
    fontWeight: '400'  
    lineHeight: '1.4'  
  label-badge:  
    fontFamily: Inter  
    fontSize: 0.75rem  
    fontWeight: '700'  
    lineHeight: '1.0'  
    letterSpacing: 0.08em  
rounded:  
  sm: 0.5rem  
  DEFAULT: 1rem  
  md: 1.5rem  
  lg: 2rem  
  xl: 3rem  
  full: 9999px  
spacing:  
  container-max: 1120px  
  section-v-desktop: 6rem  
  section-v-tablet: 5rem  
  section-v-mobile: 4rem  
  gap-2-col: 2.5rem  
  gap-3-col: 1.5rem  
  card-padding: 1.5rem  
  component-gap: 0.5rem  
\---

\#\# Brand & Style

The design system is built upon a philosophy of \*\*"Evidence-based Softness."\*\* It is designed specifically for parents of children with special nutritional needs, necessitating a UI that feels expert and authoritative yet deeply supportive and calm. The aesthetic departs from traditional "medical blue" or "clinical white" in favor of an organic, herbal-inspired direction that feels like a "safe harbor."

The visual style is a blend of \*\*Corporate Modern\*\* and \*\*Tactile Minimalism\*\*. In this light-themed iteration, the UI provides a bright, clean, and airy environment that feels optimistic and professional. It utilizes structured grids and rigorous typography to convey scientific reliability, while employing large border radii, soft organic shadows, and a nature-inspired palette to provide a nurturing, non-clinical atmosphere. High-end glassmorphism is used for navigation and layered elements to add depth without introducing visual clutter on the crisp, light canvas.

\#\# Colors

The palette is rooted in natural, "herbal" tones. Optimized for a \*\*Light Mode\*\* experience, the system uses a clean white and light olive base to maintain a fresh, supportive atmosphere.

\- \*\*Primary (Deep Forest):\*\* Used for brand identity, key semantic blocks, and accenting primary containers. In light mode, it provides strong grounding for text and headers.  
\- \*\*Secondary (Lime Accent):\*\* Reserved exclusively for interactive elements like primary buttons, progress bars, and active states to ensure high visibility.  
\- \*\*Tertiary (Light Sage):\*\* Employed for subtle UI underlays and secondary containers to create warmth and soft differentiation between sections.  
\- \*\*Neutral (Dark Olive):\*\* Used primarily for typography and iconography to ensure high legibility against the light background, avoiding pure black for a softer, more organic visual feel.

\*\*Accessibility Note:\*\* In light mode, ensure that the Lime Accent is paired with dark text (Neutral) to maintain sufficient contrast for interactive components.

\#\# Typography

This design system pairs a sophisticated serif for emotional authority with a highly legible sans-serif for functional interface elements.

\- \*\*Headlines:\*\* Use \*\*Playfair Display\*\*. It conveys the "Expert" personality. It should be used for all page titles, section headers, and card titles.  
\- \*\*Body & UI:\*\* Use \*\*Inter\*\*. It provides the "Evidence-based" feel through its clean, systematic appearance.   
\- \*\*Text Hierarchy:\*\* In light mode, primary body text uses the Neutral Dark Olive for maximum readability, while secondary information uses a muted variant of the neutral to establish hierarchy.

\#\# Layout & Spacing

The layout philosophy follows a \*\*fixed grid\*\* approach for content constraints, ensuring that information remains digestible and focused. 

\- \*\*Container:\*\* Main content is constrained to a maximum width of 1120px, centered on the screen.  
\- \*\*Rhythm:\*\* Vertical spacing is generous to emphasize a "calm" atmosphere. Sections are separated by large spaces (64px to 96px depending on device).  
\- \*\*Grid Strategy:\*\*   
  \- Use a 2-column layout for hero sections and major features with a 2.5rem gap.  
  \- Use a 3-column layout for resource cards or stat blocks with a 1.5rem gap.  
\- \*\*Responsive Reflow:\*\* On mobile, all grids collapse to a single column with 1rem lateral margins to maintain safe touch targets and readability.

\#\# Elevation & Depth

Depth in this light-themed system is organic and soft, utilizing subtle shadows and layering to maintain a clean, airy feel.

\- \*\*Glassmorphism:\*\* The primary navigation header uses a backdrop blur (16px) with a highly transparent light surface to create a sense of persistent orientation and modern layering.  
\- \*\*Tonal Layering:\*\* Surfaces are primarily tiered using very subtle color shifts (White background vs. slightly tinted Surface cards) to provide structure without heavy visual weight.  
\- \*\*Shadows:\*\*   
  \- \*\*Soft Elevation:\*\* Ambient, low-opacity shadows are used to lift cards and interactive elements. Shadows should have a slight olive tint to remain cohesive with the palette.  
  \- \*\*CTA Lift:\*\* Primary buttons use a soft, light-tinted glow or shadow to suggest interactivity and a tactile, premium feel.

\#\# Shapes

The shape language is strictly \*\*soft and rounded\*\*, with a total absence of sharp 90-degree corners to reinforce the nurturing brand personality.

\- \*\*Buttons & Badges:\*\* Always use the \`pill-shaped\` (999px) radius.  
\- \*\*Cards:\*\* Use a \`rounded-xl\` (3rem/48px) radius for a soft, containerized look.  
\- \*\*Images:\*\* Large photography should have a \`rounded-xl\` radius to blend into the soft aesthetic.  
\- \*\*Inputs:\*\* Form fields use a \`rounded-lg\` (2rem/32px) radius to maintain consistency with the overall roundness.

\#\# Components

\#\#\# Buttons & CTAs  
\- \*\*Primary Button:\*\* Pill-shaped, Lime Accent background with Dark Olive text. On hover, the button should lift slightly (\`translateY(-1px)\`) and increase shadow depth.  
\- \*\*Secondary/Ghost Button:\*\* Pill-shaped with a 1px border in the Primary Forest Green or a muted neutral.

\#\#\# Cards & Surfaces  
\- \*\*Content Cards:\*\* 48px corner radius, utilizing light surface-container colors. In light mode, apply a very soft shadow to define edges against the white background.  
\- \*\*Stat Cards:\*\* Use the glassmorphic style (blur \+ semi-transparent light surface) when layered over imagery to maintain legibility.

\#\#\# Inputs & Forms  
\- \*\*Fields:\*\* 32px corner radius, white or very light neutral background, with a 1px \`Muted Border\`. Focus states should use a 1px solid Primary Forest Green stroke.  
\- \*\*Error States:\*\* Use Error Red for border and helper text, ensuring contrast against light surfaces.

\#\#\# Feedback & Progress  
\- \*\*Progress Bars:\*\* Use a light neutral track with a Lime Accent fill. The ends of the bar and the fill must be rounded/pill-shaped.  
\- \*\*Badges:\*\* All-caps Inter font, pill-shaped, with high letter spacing and light tertiary backgrounds.

\#\#\# Iconography  
\- Use simple line icons with a 1.5px to 2px stroke weight. Icons should be colored in Dark Olive or Primary Forest Green to maintain brand alignment and visibility.  
