// Local variable-font files (public/krakatau/fonts): the render browser cannot reach Google Fonts through the proxy.
import { continueRender, delayRender, staticFile } from "remotion";

export const SERIF = "KrakatauSerif"; // Cormorant Garamond (variable 300-700)
export const SANS = "KrakatauSans"; // Inter (variable 100-900)

const load = (family: string, file: string, weight: string) => {
  if (typeof document === "undefined") return;
  const h = delayRender(`font ${family}`);
  const face = new FontFace(family, `url(${staticFile(`krakatau/fonts/${file}`)}) format("woff2")`, { weight });
  face
    .load()
    .then((f) => {
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
      continueRender(h);
    })
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};

load(SERIF, "CormorantGaramond.woff2", "300 700");
load(SANS, "Inter.woff2", "100 900");
