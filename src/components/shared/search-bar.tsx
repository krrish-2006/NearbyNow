"use client";

export default function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Search nearby products..."
      className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-black"
    />
  );
}
