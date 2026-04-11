import sharp from "sharp";

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="bubble" x1="64" y1="96" x2="448" y2="416" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M112 144C112 117.5 133.5 96 160 96H352C378.5 96 400 117.5 400 144V288C400 314.5 378.5 336 352 336H288L208 416V336H160C133.5 336 112 314.5 112 288V144Z" fill="url(#bubble)"/>
  <circle cx="200" cy="216" r="28.8" fill="white"/>
  <circle cx="256" cy="216" r="28.8" fill="white"/>
  <circle cx="312" cy="216" r="28.8" fill="white"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/logo.png");
await sharp(Buffer.from(svg)).png().toFile("public/logo-dark.png");
console.log("Generated public/logo.png and public/logo-dark.png");
