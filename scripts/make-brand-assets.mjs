// Generate app icons and wordmarks from scripts/assets/.
// Run from the repo root with `node scripts/make-brand-assets.mjs`.
//
// sharp is a transitive dependency of Next.js rather than a declared one, which
// is why this is a standalone script and not imported by any app code.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const MARK = fileURLToPath(new URL("./assets/logo.png", import.meta.url));
const WORDMARK = fileURLToPath(new URL("./assets/typologo.png", import.meta.url));

for (const file of [MARK, WORDMARK]) {
  if (!existsSync(file)) {
    console.error(`missing source asset: ${file}`);
    process.exit(1);
  }
}

// Favicon and iOS home screen icon, from the square mark.
await sharp(MARK)
  .resize(256, 256, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile("app/icon.png");
await sharp(MARK)
  .resize(180, 180, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile("app/apple-icon.png");

// Wordmark for the header: trim the transparent padding, then downscale.
// 640px is deliberate: the smallest candidate next/image will ever request is
// 640, so a narrower source would be upscaled on every request. At the size
// this renders (about 116 CSS pixels wide) that is still roughly 5x.
const trimmed = await sharp(WORDMARK).trim({ threshold: 12 }).toBuffer({
  resolveWithObject: true,
});
const source = await sharp(WORDMARK).metadata();
console.log(
  `wordmark: ${source.width}x${source.height} -> trimmed ${trimmed.info.width}x${trimmed.info.height}`
);
await sharp(trimmed.data)
  .resize({ width: 640 })
  .png({ compressionLevel: 9 })
  .toFile("public/typologo.png");

// White wordmark for the floating header over the dark homepage hero. The
// source lettering is dark blue and vanishes against the hero, so the shapes
// are rebuilt as solid white by pairing a white RGB plate with the source
// alpha channel. Reusing the alpha keeps every edge of the letterforms; a tint
// or a composite would have flattened the brand-coloured dots in the mark.
//
// joinChannel rather than composite with dest-in: the composite blend left a
// fully transparent result here, because it multiplies against the alpha of the
// plate rather than substituting it.
const alphaChannel = await sharp(trimmed.data).extractChannel(3).toBuffer();
const whiteWordmark = await sharp({
  create: {
    width: trimmed.info.width,
    height: trimmed.info.height,
    channels: 3,
    background: { r: 255, g: 255, b: 255 },
  },
})
  .joinChannel(alphaChannel)
  .png()
  .toBuffer();

await sharp(whiteWordmark)
  .resize({ width: 640 })
  .png({ compressionLevel: 9 })
  .toFile("public/typologo-light.png");

for (const out of ["app/icon.png", "app/apple-icon.png", "public/typologo.png", "public/typologo-light.png"]) {
  const meta = await sharp(out).metadata();
  const kb = Math.round(statSync(out).size / 1024);
  console.log(`${out}: ${meta.width}x${meta.height}  ${kb}KB`);
}
