/**
 * Script to create an admin user
 * Run with: node scripts/create-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log("\n🔐 Create Admin User\n");

    const email = await question("Email: ");
    const password = await question("Password: ");
    const name = await question("Name (optional): ");
    const role = await question(
      "Role (SUPER_ADMIN/ADMIN/MODERATOR) [MODERATOR]: ",
    );

    if (!email || !password) {
      console.error("❌ Email and password are required!");
      process.exit(1);
    }

    // Validate role
    const validRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR"];
    const adminRole = role.toUpperCase() || "MODERATOR";

    if (!validRoles.includes(adminRole)) {
      console.error(
        "❌ Invalid role! Must be SUPER_ADMIN, ADMIN, or MODERATOR",
      );
      process.exit(1);
    }

    // Check if admin exists
    const existing = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      console.error("❌ Admin with this email already exists!");
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        role: adminRole,
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`\nID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name || "N/A"}`);
    console.log(`Role: ${admin.role}`);
    console.log(`\nYou can now login at: /admin/login\n`);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
