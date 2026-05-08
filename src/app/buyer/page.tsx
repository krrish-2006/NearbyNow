import SearchBar from "@/components/shared/search-bar";
import LogoutButton from "@/features/auth/components/logout-button";
import { getCurrentUser } from "@/features/auth/utils/auth";
import { redirect } from "next/navigation";

export default async function BuyerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {user.user_metadata.full_name}
            </h1>

            <p className="mt-1 text-neutral-600">Find products near you</p>
          </div>

          <LogoutButton />
        </div>

        <SearchBar />
      </div>
    </main>
  );
}
