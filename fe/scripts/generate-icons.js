const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const inputImage = path.join(__dirname, "../public/images/nawanapam.png");
const outputDir = path.join(__dirname, "../public/icons");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const iconSizes = [
  { name: "manifest-icon-192.maskable.png", size: 192 },
  { name: "manifest-icon-512.maskable.png", size: 512 },
  { name: "apple-icon-180.png", size: 180 },
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-48.png", size: 48 },
  { name: "favicon-64.png", size: 64 },
];

async function generateIcons() {
  console.log("Starting icon generation from:", inputImage);

  for (const icon of iconSizes) {
    const outputPath = path.join(outputDir, icon.name);

    try {
      await sharp(inputImage)
        .resize(icon.size, icon.size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log("\nIcon generation complete!");
}

generateIcons().catch(console.error);
