const { spawn } = require("child_process");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  fg: {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
  },
};

function log(prefix, color, message) {
  console.log(`${color}${colors.bright}[${prefix}]${colors.reset} ${message}`);
}

function runCommand(cmd, args, cwd, prefix, color) {
  return new Promise((resolve, reject) => {
    log(prefix, color, `Starting in ${cwd}...`);

    const proc = spawn(cmd, args, {
      cwd,
      stdio: "pipe",
      shell: true,
    });

    proc.stdout.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((line) => line.trim())
        .forEach((line) => log(prefix, color, line));
    });

    proc.stderr.on("data", (data) => {
      data
        .toString()
        .split("\n")
        .filter((line) => line.trim())
        .forEach((line) => log(prefix, colors.fg.red, line));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        log(prefix, colors.fg.red, `Process exited with code ${code}`);
        reject(new Error(`${prefix} failed`));
      } else {
        log(prefix, color, "Process completed");
        resolve();
      }
    });

    proc.on("error", (err) => {
      log(prefix, colors.fg.red, `Error: ${err.message}`);
      reject(err);
    });
  });
}

async function startFrontend() {
  const fePath = path.join(__dirname, "..", "fe");
  await runCommand("npm", ["run", "dev"], fePath, "FE", colors.fg.cyan);
}

async function startBackend() {
  const bePath = path.join(__dirname, "..", "be");
  await runCommand("npm", ["run", "dev"], bePath, "BE", colors.fg.magenta);
}

async function startBoth() {
  log("BOTH", colors.fg.green, "Starting Frontend and Backend...");

  const fePath = path.join(__dirname, "..", "fe");
  const bePath = path.join(__dirname, "..", "be");

  // Start both processes without waiting
  const feProc = spawn("npm", ["run", "dev"], {
    cwd: fePath,
    stdio: "pipe",
    shell: true,
  });

  const beProc = spawn("npm", ["run", "dev"], {
    cwd: bePath,
    stdio: "pipe",
    shell: true,
  });

  // Handle frontend output
  feProc.stdout.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter((line) => line.trim())
      .forEach((line) => log("FE", colors.fg.cyan, line));
  });

  feProc.stderr.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter((line) => line.trim())
      .forEach((line) => log("FE", colors.fg.red, line));
  });

  // Handle backend output
  beProc.stdout.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter((line) => line.trim())
      .forEach((line) => log("BE", colors.fg.magenta, line));
  });

  beProc.stderr.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter((line) => line.trim())
      .forEach((line) => log("BE", colors.fg.red, line));
  });

  // Handle process exit
  feProc.on("close", (code) => {
    log("FE", colors.fg.red, `Frontend exited with code ${code}`);
    beProc.kill();
    process.exit(code);
  });

  beProc.on("close", (code) => {
    log("BE", colors.fg.red, `Backend exited with code ${code}`);
    feProc.kill();
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    log("BOTH", colors.fg.yellow, "Shutting down...");
    feProc.kill();
    beProc.kill();
    process.exit(0);
  });
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case "fe":
  case "frontend":
    startFrontend().catch((err) => {
      console.error(err);
      process.exit(1);
    });
    break;

  case "be":
  case "backend":
    startBackend().catch((err) => {
      console.error(err);
      process.exit(1);
    });
    break;

  case "both":
  case "all":
    startBoth();
    break;

  default:
    console.log(`
${colors.bright}Usage:${colors.reset}
  node scripts/start.js <command>

${colors.bright}Commands:${colors.reset}
  ${colors.fg.cyan}fe${colors.reset}, ${colors.fg.cyan}frontend${colors.reset}  - Start frontend only
  ${colors.fg.magenta}be${colors.reset}, ${colors.fg.magenta}backend${colors.reset}   - Start backend only
  ${colors.fg.green}both${colors.reset}, ${colors.fg.green}all${colors.reset}       - Start both frontend and backend

${colors.bright}Examples:${colors.reset}
  node scripts/start.js fe
  node scripts/start.js be
  node scripts/start.js both
    `);
    process.exit(1);
}
