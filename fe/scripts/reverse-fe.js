const { execSync } = require("child_process");

const reversePort = (port) => {
  try {
    console.log(`Setting up ADB reverse for port ${port}...`);
    execSync(`adb reverse tcp:${port} tcp:${port}`, { stdio: "inherit" });
    console.log(`✓ ADB reverse tcp:${port} tcp:${port} successful!`);
  } catch (error) {
    console.error(`✗ Failed to set up ADB reverse: ${error.message}`);
    console.error("Make sure:");
    console.error("1. ADB is installed and in your PATH");
    console.error("2. USB debugging is enabled on your device");
    console.error("3. Device is connected via USB");
    process.exit(1);
  }
};

reversePort(3000);
