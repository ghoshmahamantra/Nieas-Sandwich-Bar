export interface FontOption {
  id: string;
  name: string;
  category: "sans" | "serif" | "display" | "handwriting";
  styleLabel: string;
  googleFontName: string;
  fontFamilyCss: string;
  description: string;
}

export const FONT_REGISTRY: FontOption[] = [
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    category: "sans",
    styleLabel: "Modern Clean Sans",
    googleFontName: "Plus+Jakarta+Sans:wght@400;500;600;700;800",
    fontFamilyCss: "'Plus Jakarta Sans', sans-serif",
    description: "Crisp, balanced & modern cafe aesthetic",
  },
  {
    id: "outfit",
    name: "Outfit",
    category: "sans",
    styleLabel: "Artisanal Geometric",
    googleFontName: "Outfit:wght@400;500;600;700;800;900",
    fontFamilyCss: "'Outfit', sans-serif",
    description: "Contemporary curves popular in modern bistros",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    category: "serif",
    styleLabel: "Luxury Gourmet Serif",
    googleFontName: "Playfair+Display:ital,wght@0,400..900;1,400..900",
    fontFamilyCss: "'Playfair Display', Georgia, serif",
    description: "Artisanal European boutique bakery vibe",
  },
  {
    id: "inter",
    name: "Inter",
    category: "sans",
    styleLabel: "High Legibility Sans",
    googleFontName: "Inter:wght@400;500;600;700;800",
    fontFamilyCss: "'Inter', sans-serif",
    description: "Ultra-clear neutral digital typography",
  },
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    category: "serif",
    styleLabel: "Classic Parisian Bistro",
    googleFontName: "Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400",
    fontFamilyCss: "'Cormorant Garamond', Georgia, serif",
    description: "Refined vintage French cafe elegance",
  },
  {
    id: "cinzel",
    name: "Cinzel",
    category: "display",
    styleLabel: "Regal Luxury Roman",
    googleFontName: "Cinzel:wght@500;700;900",
    fontFamilyCss: "'Cinzel', serif",
    description: "Stately golden luxury headline display",
  },
  {
    id: "fraunces",
    name: "Fraunces",
    category: "serif",
    styleLabel: "Heritage Warm Bakery",
    googleFontName: "Fraunces:opsz,wght@9..144,400..900",
    fontFamilyCss: "'Fraunces', serif",
    description: "Warm, chubby 20th-century artisanal feel",
  },
  {
    id: "syne",
    name: "Syne",
    category: "display",
    styleLabel: "Contemporary Bold",
    googleFontName: "Syne:wght@600;700;800",
    fontFamilyCss: "'Syne', sans-serif",
    description: "Eye-catching geometric street style",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    category: "sans",
    styleLabel: "Urban Bistro Poster",
    googleFontName: "Montserrat:wght@400;600;700;800;900",
    fontFamilyCss: "'Montserrat', sans-serif",
    description: "Bold architectural urban sandwich bar styling",
  },
  {
    id: "poppins",
    name: "Poppins",
    category: "sans",
    styleLabel: "Friendly Rounded Sans",
    googleFontName: "Poppins:wght@400;500;600;700;800",
    fontFamilyCss: "'Poppins', sans-serif",
    description: "Smooth, friendly and approachable vibe",
  },
  {
    id: "space_grotesk",
    name: "Space Grotesk",
    category: "display",
    styleLabel: "Modernist Deli",
    googleFontName: "Space+Grotesk:wght@400;500;600;700",
    fontFamilyCss: "'Space Grotesk', sans-serif",
    description: "Sharp, punchy tech-craft sandwich aesthetic",
  },
  {
    id: "dm_sans",
    name: "DM Sans",
    category: "sans",
    styleLabel: "Nordic Clean Minimalist",
    googleFontName: "DM+Sans:ital,wght@0,400;0,500;0,700;1,400",
    fontFamilyCss: "'DM Sans', sans-serif",
    description: "Ultra-crisp Scandinavian coffee bar typography",
  },
  {
    id: "lora",
    name: "Lora",
    category: "serif",
    styleLabel: "Cozy Storybook Serif",
    googleFontName: "Lora:ital,wght@0,400;0,600;0,700;1,400",
    fontFamilyCss: "'Lora', serif",
    description: "Warm literary brunch and tea room serif",
  },
  {
    id: "raleway",
    name: "Raleway",
    category: "sans",
    styleLabel: "Refined High Fashion",
    googleFontName: "Raleway:wght@400;500;600;700;800;900",
    fontFamilyCss: "'Raleway', sans-serif",
    description: "Sophisticated thin-to-bold contrast",
  },
  {
    id: "oswald",
    name: "Oswald",
    category: "display",
    styleLabel: "Condensed Heavy Menu",
    googleFontName: "Oswald:wght@500;600;700",
    fontFamilyCss: "'Oswald', sans-serif",
    description: "Tall impactful chalkboard menu letters",
  },
  {
    id: "caveat",
    name: "Caveat",
    category: "handwriting",
    styleLabel: "Handcrafted Barista Script",
    googleFontName: "Caveat:wght@600;700",
    fontFamilyCss: "'Caveat', cursive",
    description: "Handwritten chalkboard specials & notes",
  },
  {
    id: "marcellus",
    name: "Marcellus",
    category: "serif",
    styleLabel: "Specialty Roastery",
    googleFontName: "Marcellus",
    fontFamilyCss: "'Marcellus', serif",
    description: "Flared serif display crafted for specialty cafes",
  },
];

export function getFontById(id?: string): FontOption {
  if (!id) return FONT_REGISTRY[0];
  return (
    FONT_REGISTRY.find((f) => f.id === id || f.name.toLowerCase() === id.toLowerCase()) ||
    FONT_REGISTRY[0]
  );
}

/**
 * Dynamically loads Google Fonts in the document head
 */
export function ensureGoogleFontLoaded(fontIdOrName: string): void {
  if (typeof document === "undefined") return;
  const font = getFontById(fontIdOrName);
  if (!font) return;

  const elementId = `gfont-${font.id}`;
  if (!document.getElementById(elementId)) {
    const link = document.createElement("link");
    link.id = elementId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontName}&display=swap`;
    document.head.appendChild(link);
  }
}

/**
 * Applies active font configuration to HTML root element
 */
export function applyGlobalTypography(
  fontId: string,
  scalePercent: number = 100,
  heroFontId?: string,
  heroFontSize?: number
): void {
  if (typeof document === "undefined") return;

  // 1. Ensure fonts are loaded
  ensureGoogleFontLoaded(fontId);
  if (heroFontId) ensureGoogleFontLoaded(heroFontId);

  const font = getFontById(fontId);
  const heroFont = heroFontId ? getFontById(heroFontId) : font;

  // 2. Set root CSS custom properties
  document.documentElement.style.setProperty("--font-primary", font.fontFamilyCss);
  document.documentElement.style.setProperty("--font-site-scale", `${scalePercent}%`);
  document.documentElement.style.fontSize = `${(scalePercent / 100) * 16}px`;

  if (heroFont) {
    document.documentElement.style.setProperty("--hero-font-family", heroFont.fontFamilyCss);
  }
  if (heroFontSize) {
    document.documentElement.style.setProperty("--hero-font-size", `${heroFontSize}px`);
  }

  // Set data attributes for backward compatibility
  document.documentElement.setAttribute("data-font-family", font.id);
  document.documentElement.setAttribute("data-font-scale-pct", String(scalePercent));
}
