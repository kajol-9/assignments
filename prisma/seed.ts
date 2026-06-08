import { PrismaClient, Role, MemberStatus } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding admin account...");

  const adminExists = await prisma.member.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!adminExists) {
    await prisma.member.create({
      data: {
        name:         "Library Admin",
        email:        "admin@library.local",
        studentId:    "ADMIN001",
        department:   "Administration",
        membershipId: "LIB-ADMIN-001",
        passwordHash: hashPassword("Admin@1234"),
        role:         Role.ADMIN,
        status:       MemberStatus.ACTIVE,
        expiresAt:    new Date("2099-12-31"),
      },
    });
    console.log("Admin created: admin@library.local / Admin@1234");
  }

  console.log("Done. Add books via /admin or directly in Prisma Studio.");
  console.log("Run: npm run db:studio");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
