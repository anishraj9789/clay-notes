/* ===========================================================
   Supabase client setup
   -----------------------------------------------------------
   1. Create a project at https://supabase.com
   2. Go to Project Settings -> API
   3. Copy the "Project URL" and the "anon public" key below
   -----------------------------------------------------------
   Do not paste your "service_role" key here — that key is
   secret and must never be used in frontend code.
   =========================================================== */

const SUPABASE_URL = "https://utnngqhxpqoeatmxaujj.supabase.co"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bm5ncWh4cHFvZWF0bXhhdWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5Mzk1ODgsImV4cCI6MjA5NzUxNTU4OH0.DX3zS60YYFnrPKX79-ibiOHUNM9khSBLUKbimiwS5q8";

// `supabase` here is the global UMD object injected by the CDN script
// in each HTML file. We create our client as `window.sb` so the rest
// of the app's scripts can use it without naming collisions.
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
