import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled locally (public/fonts) so rendering works offline.
// Luckiest Guy and Nunito are both SIL Open Font License fonts from Google Fonts.
loadFont({ family: "Luckiest Guy", url: staticFile("fonts/LuckiestGuy.woff2"), weight: "400" });
loadFont({ family: "Nunito", url: staticFile("fonts/Nunito.woff2"), weight: "200 1000" });

export const display = "Luckiest Guy";
export const body = "Nunito";

export const C = {
  ink: "#1c1712",
  cream: "#fff4dc",
  paper: "#f6e7c4",
  orange: "#e8812c",
  amber: "#f4b23e",
  red: "#c8352b",
  leaf: "#4f7a3a",
  white: "#ffffff",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
