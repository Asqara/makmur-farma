import {
  DEMO_USER_PASSWORD,
  type UserRole,
} from "@/constants/auth";
import { users } from "@/drizzle-schema";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const DEMO_USERS: Array<{
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}> = [
  {
    email: "admin@makmur-farma.test",
    fullName: "Admin Makmur",
    phone: "081100000001",
    role: "ADMIN",
  },
  {
    email: "apoteker@makmur-farma.test",
    fullName: "Apt. Sari Makmur",
    phone: "081100000002",
    role: "PHARMACIST",
  },
  {
    email: "kasir@makmur-farma.test",
    fullName: "Dewi Kasir",
    phone: "081100000003",
    role: "CASHIER",
  },
  {
    email: "pelanggan@makmur-farma.test",
    fullName: "Budi Pelanggan",
    phone: "081100000004",
    role: "CUSTOMER",
  },
];

async function seed() {
  const passwordHash = await hashPassword(DEMO_USER_PASSWORD);
  const now = new Date();

  for (const user of DEMO_USERS) {
    const normalizedEmail = user.email.toLowerCase();

    await db
      .insert(users)
      .values({
        email: user.email,
        emailVerifiedAt: now,
        fullName: user.fullName,
        isActive: true,
        normalizedEmail,
        passwordHash,
        phone: user.phone,
        role: user.role,
        status: "ACTIVE",
      })
      .onConflictDoUpdate({
        set: {
          emailVerifiedAt: now,
          fullName: user.fullName,
          isActive: true,
          passwordHash,
          phone: user.phone,
          role: user.role,
          status: "ACTIVE",
          updatedAt: now,
        },
        target: users.normalizedEmail,
      });
  }
}

seed()
  .then(() => {
    console.info(
      `Seed selesai. Password demo: ${DEMO_USER_PASSWORD}. Gunakan hanya untuk development.`,
    );
  })
  .catch((error) => {
    console.error("Seed gagal.", error);
    process.exitCode = 1;
  });
