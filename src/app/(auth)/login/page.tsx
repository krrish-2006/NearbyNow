import GoogleLoginButton from "@/features/auth/components/google-login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold">Welcome to NearbyNow</h1>

        <p className="mb-6 text-neutral-600">Login to continue</p>

        <GoogleLoginButton />
      </div>
    </main>
  );
}
