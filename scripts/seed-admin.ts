import config from "../payload.config";
import { getPayload } from "payload";

export async function seedAdmin() {
  console.log("🌱 Initializing Payload for Seeding...");
  const payload = await getPayload({ config });

  const adminEmail = "admin@akamdigital.in";
  const adminPassword = "Admin123!@#";

  const editorialEmail = "editor@akamdigital.in";
  const editorialPassword = "Editor123!@#";

  // 1. Seed Admin User
  const existingAdmins = await payload.find({
    collection: "users",
    where: {
      email: {
        equals: adminEmail,
      },
    },
  });

  if (existingAdmins.totalDocs === 0) {
    console.log(`Creating initial Admin user: ${adminEmail}`);
    await payload.create({
      collection: "users",
      data: {
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        name: "System Administrator",
      },
    });
    console.log("✅ Admin user created successfully!");
  } else {
    console.log(`ℹ️ Admin user ${adminEmail} already exists.`);
  }

  // 2. Seed Editorial Team User
  const existingEditors = await payload.find({
    collection: "users",
    where: {
      email: {
        equals: editorialEmail,
      },
    },
  });

  if (existingEditors.totalDocs === 0) {
    console.log(`Creating initial Editorial user: ${editorialEmail}`);
    await payload.create({
      collection: "users",
      data: {
        email: editorialEmail,
        password: editorialPassword,
        role: "editorial",
        name: "Editorial Team Lead",
      },
    });
    console.log("✅ Editorial user created successfully!");
  } else {
    console.log(`ℹ️ Editorial user ${editorialEmail} already exists.`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("❌ Error seeding database:", err);
  process.exit(1);
});
