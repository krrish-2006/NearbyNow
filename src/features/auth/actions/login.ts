"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function loginWithGoogle() {
  const supabase = await createClient();

  const headersList = await headers();

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");

  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  const siteOrigin =
    host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL;

  const authUrl = `${siteOrigin}/auth/callback`;

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
