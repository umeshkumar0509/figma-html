/**
 * Stage 1 — Vision analysis. We show Gemini the reference screenshot and ask
 * it to return a structured "design token" JSON: layout blocks in order,
 * color palette, typography, spacing, and notable components (buttons,
 * badges, dividers, image placeholders). This becomes the structural
 * blueprint for the email, independent of the final copy.
 */
export const DESIGN_ANALYSIS_PROMPT = `You are a senior email designer reverse-engineering a reference screenshot.

Look carefully at the attached image, which is a screenshot of an email design (or a section of one). Analyze it the way a developer would before coding it as an HTML email:

1. Identify each visual section from top to bottom (e.g. header/logo bar, hero image, headline block, body copy, product grid, CTA button, divider, footer/social/unsubscribe). Note their approximate stacked order and relative height.
2. Extract the color palette actually used: page/background color, content surface color, primary text color, secondary/muted text color, primary accent (buttons/links), secondary accent, and border/divider color. Return real hex values, sampled as precisely as you can from what's visible.
3. Identify typography: whether headings look serif or sans-serif, approximate heading weight (bold/semibold/regular), an approximate heading size in px, and an approximate body text size in px.
4. Estimate spacing: typical section padding in px, and typical gap between stacked elements in px.
5. List notable reusable components you see (buttons, badges, dividers, icon rows, image placeholders, star ratings, price tags, etc.) with a one-line style description for each (shape, fill, border-radius, alignment).

Be concrete and decisive — always provide your best real hex color and best pixel estimate rather than vague ranges. This analysis will be used directly to code a pixel-faithful HTML email, so precision matters more than caveats.`;

/**
 * JSON schema (Gemini `responseSchema` / Type-based) for the design analysis
 * call. Keeping this as structured output (rather than free text) is what
 * lets stage 2 reliably merge it with the content JSON.
 */
export function buildDesignAnalysisSchema(Type) {
  return {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "One or two sentence overview of the overall design direction.",
      },
      layoutBlocks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            order: { type: Type.INTEGER },
            name: { type: Type.STRING, description: "e.g. Header, Hero, Headline, Body Copy, CTA Button, Footer" },
            description: { type: Type.STRING, description: "What this block contains and how it's arranged" },
            approxHeightPercent: { type: Type.NUMBER, description: "Rough share of total design height, 0-100" },
          },
          required: ["order", "name", "description"],
        },
      },
      colorPalette: {
        type: Type.OBJECT,
        properties: {
          background: { type: Type.STRING },
          surface: { type: Type.STRING },
          primaryText: { type: Type.STRING },
          secondaryText: { type: Type.STRING },
          accentPrimary: { type: Type.STRING },
          accentSecondary: { type: Type.STRING },
          borderColor: { type: Type.STRING },
        },
        required: ["background", "surface", "primaryText", "secondaryText", "accentPrimary", "borderColor"],
      },
      typography: {
        type: Type.OBJECT,
        properties: {
          headingStyle: { type: Type.STRING, description: "serif or sans-serif, plus general character" },
          headingWeight: { type: Type.STRING },
          headingSizePx: { type: Type.NUMBER },
          bodySizePx: { type: Type.NUMBER },
        },
      },
      spacing: {
        type: Type.OBJECT,
        properties: {
          sectionPaddingPx: { type: Type.NUMBER },
          elementGapPx: { type: Type.NUMBER },
        },
      },
      components: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "button | badge | divider | image_placeholder | icon_row | other" },
            style: { type: Type.STRING },
          },
        },
      },
    },
    required: ["summary", "layoutBlocks", "colorPalette", "typography", "spacing"],
  };
}

/**
 * Stage 2 — Merge the design blueprint with the user's content JSON and
 * compile a production-ready, table-based HTML email. This is a plain-text
 * (HTML-out) call, not JSON mode.
 */
export function buildHtmlGenerationPrompt({ designAnalysis, contentJson, userInstructions }) {
  return `You are a senior email developer. Build ONE complete, production-ready HTML email using the design blueprint and content data below. Output ONLY the raw HTML document — no markdown code fences, no commentary before or after.

=== DESIGN BLUEPRINT (structure, colors, type, spacing extracted from the reference screenshot) ===
${JSON.stringify(designAnalysis, null, 2)}

=== CONTENT DATA (use this for all real copy, links, and image URLs — do not invent content that contradicts it; if a field is missing, write short, sensible placeholder copy that matches the tone) ===
${JSON.stringify(contentJson, null, 2)}

${userInstructions ? `=== ADDITIONAL INSTRUCTIONS FROM THE DESIGNER ===\n${userInstructions}\n` : ""}

=== HARD REQUIREMENTS ===
1. Total table width is exactly 600px, centered on the page. Outer wrapper is a 100%-width table with the content table (width="600") nested and centered inside it.
2. Table-based layout only: use nested <table role="presentation" cellpadding="0" cellspacing="0" border="0"> for every structural block. Do not use <div> for layout, no CSS flexbox or grid.
3. Every style is inline via the style="" attribute on the element itself. Do not use a <style> block or external stylesheet, and do not use <link> or <script> tags.
4. Reproduce the SAME structure and visual order as layoutBlocks in the design blueprint: same sections, same stacking order, same approximate proportions.
5. Use the exact hex colors from colorPalette for backgrounds, text, borders, and buttons. Use the fonts/sizes from typography (map to safe email font stacks, e.g. Arial/Helvetica/sans-serif or Georgia/Times/serif — always include a web-safe fallback stack, never a single custom font name alone).
6. Buttons/CTAs must use the bulletproof table-button pattern: a small table containing one <td> with a solid background color, padding, and border-radius set inline, wrapping an <a> with matching inline styles (color, text-decoration:none, display:block, font-weight). Do not rely on padding on a bare <a> or <button> tag.
7. All <img> tags need explicit width and height attributes, style="display:block;", and a meaningful alt attribute. Use image URLs from the content data where provided; otherwise use "https://placehold.co/600x300" sized appropriately.
8. Add standard Outlook/Windows Mail safety: XHTML doctype, <html xmlns="http://www.w3.org/1999/xhtml">, a <head> with charset meta, viewport meta, and MSO conditional comments (<!--[if mso]>...<![endif]-->) around the 600px table width to force Outlook to respect the fixed width.
9. Keep line-height, font-size and color set inline on every text-bearing element (td, p, span, a) — never assume inheritance will render correctly in Outlook/Gmail.
10. The email must be self-contained and renderable as-is by pasting into any ESP or opening directly in a browser.

Return only the final HTML document, starting with <!doctype html> and nothing else.`;
}

/**
 * Follow-up turns in the conversation (no new screenshot attached) refine the
 * most recently generated HTML in place, rather than re-running the vision
 * analysis. Keeps the same hard requirements in force so a refinement can't
 * accidentally drop table structure / inline CSS / the 600px constraint.
 */
export function buildHtmlRefinementPrompt({ previousHtml, contentJson, userInstructions }) {
  return `You are a senior email developer editing an existing HTML email per the designer's follow-up request. Output ONLY the complete, updated raw HTML document — no markdown code fences, no commentary.

=== CURRENT HTML EMAIL ===
${previousHtml}

=== CONTENT DATA (still authoritative for copy/links/images not explicitly overridden below) ===
${JSON.stringify(contentJson, null, 2)}

=== REQUESTED CHANGE ===
${userInstructions || "Make a small visual refinement consistent with the design's existing style."}

=== RULES ===
1. Apply only the requested change — keep every other section, color, and piece of copy exactly as it is unless the change requires touching it.
2. Preserve all existing hard constraints: 600px width, table-based layout only (role="presentation" tables, no divs for structure), fully inline CSS (no <style> block), bulletproof table-button pattern for CTAs, explicit width/height + alt on images, MSO conditional comments for Outlook.
3. Return the entire HTML document, starting with <!doctype html> — not a diff, not just the changed fragment.`;
}
