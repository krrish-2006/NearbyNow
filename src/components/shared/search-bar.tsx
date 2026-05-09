"use client";

import { useRouter } from "next/navigation";

import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!search.trim()) {
      router.push("/");
      return;
    }

    router.push(`/?search=${encodeURIComponent(search)}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex overflow-hidden rounded-[2rem] border-2 border-black bg-white shadow-sm"
    >
      <input
        type="text"
        placeholder="Search nearby products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 px-6 py-5 text-lg outline-none"
      />

      <button
        type="submit"
        className="cursor-pointer bg-black px-8 text-lg font-bold text-white transition-all duration-200 hover:bg-neutral-800 hover:shadow-xl active:scale-95"
      >
        Search
      </button>
    </form>
  );
}
