import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "hnj67t8gbhgjdw948hf3f89h4jrf",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "postgres://postgres.rwncydntaqmznrzwjthq:8Wt8esokF0kdZZjz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    },
  }),
});
