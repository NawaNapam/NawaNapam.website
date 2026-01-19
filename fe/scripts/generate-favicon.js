const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const inputImage = path.join(__dirname, "../public/images/nawanapam.png");
const outputFavicon = path.join(__dirname, "../public/favicon.ico");

async function generateFavicon() {
  console.log("Generating favicon.ico from:", inputImage);

  try {
    // Generate a 32x32 ICO file
    await sharp(inputImage)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .toFormat("png")
      .toFile(outputFavicon.replace(".ico", ".png"));

    // Rename to .ico (browsers will accept PNG format in .ico extension)
    fs.renameSync(outputFavicon.replace(".ico", ".png"), outputFavicon);

    console.log("✓ Generated favicon.ico");
  } catch (error) {
    console.error("✗ Failed to generate favicon.ico:", error.message);
  }
}

generateFavicon().catch(console.error);
