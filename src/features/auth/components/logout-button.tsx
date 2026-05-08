"use client";

import { logout } from "../actions/logout";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
      >
        Logout
      </button>
    </form>
  );
}
