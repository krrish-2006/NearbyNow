"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginWithGoogle() {
  const supabase = await createClient();

  const authUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authUrl,
    },
  });

  if (error) {
    redirect("/login?error=auth");
  }

  if (data.url) {
    redirect(data.url);
  }
}
