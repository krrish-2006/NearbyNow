"use client";

import { supabase } from "@/lib/supabase/client";

export default function HomePage() {
  async function testConnection() {
    const { data, error } = await supabase.auth.getSession();

    console.log("SESSION:", data);

    if (error) {
      console.log("ERROR:", error);
    }
  }

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">NearbyNow</h1>

      <button
        onClick={testConnection}
        className="mt-6 rounded bg-black px-4 py-2 text-white"
      >
        Test Supabase
      </button>
    </main>
  );
}
