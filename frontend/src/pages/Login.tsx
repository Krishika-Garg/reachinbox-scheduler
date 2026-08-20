import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { User } from "../types/user";

interface LoginProps {
  onLogin: (user: User) => void;
}

function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async (
    credential: string
  ) => {
    try {
      setGoogleLoading(true);
      setError("");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Google authentication failed"
        );
      }

      console.log("Authenticated user:", data.user);

      /*
       * Store the authenticated user.
       */
      localStorage.setItem(
        "reachinbox_user",
        JSON.stringify(data.user)
      );

      /*
       * Update App-level authentication state.
       */
      onLogin(data.user);

      /*
       * Go to dashboard.
       */
      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Google authentication failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Google authentication failed"
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  /*
   * Email/password is currently UI only.
   *
   * The assignment requires real Google OAuth,
   * so we are not implementing another authentication
   * system unnecessarily.
   */
  const handleEmailLogin = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(
      "Email and password login is not enabled. Please continue with Google."
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] px-4">
      <div className="w-full max-w-105">

        {/* Brand */}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1f1f1f]">
            <span className="text-lg font-bold text-white">
              R
            </span>
          </div>

          <h1 className="text-[28px] font-semibold tracking-tight text-[#18181b]">
            Welcome to ReachInbox
          </h1>

          <p className="mt-2 text-sm text-[#71717a]">
            Sign in to continue to your workspace
          </p>
        </div>

        {/* Card */}

        <div className="rounded-2xl border border-[#e4e4e7] bg-white p-7 shadow-sm">

          <form
            onSubmit={handleEmailLogin}
            className="space-y-5"
          >
            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#27272a]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                className="h-11 w-full rounded-lg border border-[#d4d4d8] px-3.5 text-sm outline-none placeholder:text-[#a1a1aa] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]"
              />
            </div>

            {/* Password */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-[#27272a]"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-medium text-[#52525b] hover:text-[#18181b]"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border border-[#d4d4d8] px-3.5 text-sm outline-none placeholder:text-[#a1a1aa] focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]"
              />
            </div>

            {/* Login */}

            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-[#18181b] text-sm font-semibold text-white transition hover:bg-[#27272a]"
            >
              Login
            </button>
          </form>

          {/* Divider */}

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#e4e4e7]" />

            <span className="text-xs font-medium text-[#a1a1aa]">
              OR
            </span>

            <div className="h-px flex-1 bg-[#e4e4e7]" />
          </div>

          {/* Google */}

          <div className="relative flex w-full justify-center">
            {googleLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d4d4d8] border-t-[#18181b]" />
              </div>
            )}

            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (!credentialResponse.credential) {
                  setError(
                    "Google credential was not received."
                  );
                  return;
                }

                handleGoogleLogin(
                  credentialResponse.credential
                );
              }}
              onError={() => {
                console.error("Google login failed");

                setError(
                  "Google login failed. Please try again."
                );
              }}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
            />
          </div>

          {/* Error */}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-center text-xs text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Signup */}

          <p className="mt-6 text-center text-sm text-[#71717a]">
            Don't have an account?{" "}
            <button
              type="button"
              className="font-medium text-[#18181b] hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#a1a1aa]">
          By continuing, you agree to our Terms of Service
          and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default Login;