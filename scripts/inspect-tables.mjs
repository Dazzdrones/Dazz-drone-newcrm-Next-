import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(".env", "utf8");
const vars = Object.fromEntries(
  env
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx), l.slice(idx + 1).trim()];
    })
);

const url = vars.NEXT_PUBLIC_SUPABASE_URL;
const key = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("URL set:", !!url, "Key set:", !!key);

const supabase = createClient(url, key);
const tables = [
  "booking_requests",
  "bookings",
  "callback_requests",
  "contact_requests",
  "career_applications",
  "enterprise_requests",
  "pilot_requests",
  "drone_pilot_registrations",
  "for_businesses",
  "users",
];

for (const t of tables) {
  const res = await supabase.from(t).select("*", { count: "exact" }).limit(2);
  const { data, error, count, status, statusText } = res;

  if (error) {
    console.log(`${t}: ERROR [${error.code}] ${error.message}`);
    console.log(`  details: ${error.details || "none"}`);
    console.log(`  hint: ${error.hint || "none"}`);
  } else {
    console.log(`${t}: status=${status} count=${count} rows=${data?.length}`);
    if (data?.[0]) {
      console.log(`  columns: ${Object.keys(data[0]).join(", ")}`);
      console.log(`  sample: ${JSON.stringify(data[0]).slice(0, 400)}`);
    }
  }
}
