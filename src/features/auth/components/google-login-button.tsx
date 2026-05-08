"use client";

import { loginWithGoogle } from "../actions/login";

export default function GoogleLoginButton() {
  return (
    <form action={loginWithGoogle}>
      <button
        type="submit"
        className="w-full rounded-lg bg-black px-4 py-3 text-white transition hover:bg-neutral-800"
      >
        Continue with Google
      </button>
    </form>
  );
}
