import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login");

  const isBuyerPage = pathname.startsWith("/buyer");

  const isSellerPage = pathname.startsWith("/seller");

  if ((isBuyerPage || isSellerPage) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/buyer", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/login"],
};
