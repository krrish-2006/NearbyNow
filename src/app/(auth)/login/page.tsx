import GoogleLoginButton from "@/features/auth/components/google-login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-[2rem] border bg-white p-10 shadow-sm">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight">
            NearbyNow
          </h1>

          <p className="mt-3 text-base text-neutral-600">
            Discover products from nearby local shops.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 ">
          
          <div className="mt-6">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </main>
  );
}
