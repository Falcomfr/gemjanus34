#!/usr/bin/env node
// Saves the production database and the uploaded PDFs to backups/<timestamp>/.
//
// The free Supabase plan keeps no restorable backup, so this is the only recovery point.
// A GitHub Action runs it every night in the private repo Falcomfr/gemjanus34-sauvegardes and keeps 90 days.
//
// Needs a Supabase access token with access to the project, through the Management API,
// read-only endpoint, so no Postgres password and no write right: $JANUS_SUPABASE_TOKEN (not SUPABASE_ACCESS_TOKEN, which the CLI may hold for another account) or
// ~/.config/gemjanus34-supabase-token.
// Project: $SUPABASE_PROJECT_REF, by default the production project.
//
// Usage: node scripts/backup.mjs [--out DIR]
//
// Contents:
//   db.json       every public table, plus auth.users without password hashes
//   documents/    every file of the public "documents" storage bucket
//
// Restore:
//   1. Recreate the schema by applying supabase/migrations in order.
//   2. Recreate the accounts in Authentication with the same ids (auth.users in db.json),
//      then send each person a new password: hashes are not saved.
//   3. For each public table, in the SQL editor:
//        set session_replication_role = replica;  -- skips foreign key order and triggers
//        delete from public.<table>;
//        insert into public.<table> select * from json_populate_recordset(null::public.<table>, '<rows as JSON>');
//        set session_replication_role = default;
//   4. Upload documents/ back to the "documents" bucket with the same names.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE_SIZE = 1000;

async function token() {
  if (process.env.JANUS_SUPABASE_TOKEN) return process.env.JANUS_SUPABASE_TOKEN.trim();
  return (await readFile(join(homedir(), ".config", "gemjanus34-supabase-token"), "utf8")).trim();
}

async function runSql(auth, ref, query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query/read-only`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`SQL HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

// Pages by ctid, which every table has, primary key or not.
async function dumpTable(auth, ref, table, columns = "*") {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await runSql(auth, ref, `select ${columns} from ${table} order by ctid limit ${PAGE_SIZE} offset ${offset}`);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function main() {
  const outIndex = process.argv.indexOf("--out");
  const auth = await token();
  const ref = process.env.SUPABASE_PROJECT_REF || "knanpezmzadidyfhyxgf";

  const [{ now }] = await runSql(auth, ref, "select now()::text as now");
  const out = outIndex > -1 ? process.argv[outIndex + 1] : join(root, "backups", now.replace(/[:.]/g, "-").replace(" ", "_").slice(0, 19));
  await mkdir(join(out, "documents"), { recursive: true });

  const tables = (
    await runSql(auth, ref, "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name")
  ).map((row) => row.table_name);

  const data = {};
  for (const table of tables) {
    data[`public.${table}`] = await dumpTable(auth, ref, `public.${table}`);
    console.log(`public.${table}: ${data[`public.${table}`].length}`);
  }
  data["auth.users"] = await dumpTable(auth, ref, "auth.users", "id, email, created_at, last_sign_in_at, raw_user_meta_data");
  console.log(`auth.users: ${data["auth.users"].length}`);
  await writeFile(join(out, "db.json"), JSON.stringify({ project: ref, taken_at: now, tables: data }, null, 2));

  const files = await runSql(auth, ref, "select name from storage.objects where bucket_id = 'documents' order by name");
  for (const { name } of files) {
    if (name.split("/").includes("..")) throw new Error(`Refusing document name ${name}`);
    const response = await fetch(`https://${ref}.supabase.co/storage/v1/object/public/documents/${name.split("/").map(encodeURIComponent).join("/")}`);
    if (!response.ok) throw new Error(`Document ${name}: HTTP ${response.status}`);
    const target = join(out, "documents", name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
  }
  console.log(`documents: ${files.length}`);
  console.log(`Saved to ${out}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
