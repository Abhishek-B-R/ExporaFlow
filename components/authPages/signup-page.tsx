"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { signIn, useSession } from "@/utils/auth";
import { useRouter } from "next/navigation";
import AuthButton from "./auth-button";
import { useLocalStorage } from "@/hooks/use-local-storage";

type Provider = "google" | "github";

export default function SignupPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [lastLoginPreference, setLastLoginPreference] =
    useLocalStorage<Provider | null>("lastUsedLoginPreference", null);

  useEffect(() => {
    if (session?.user?.email) {
      router.push("/");
    }
  }, [session?.user?.email, router]);

  const signUp = async (provider: Provider) => {
    try {
      setLastLoginPreference(provider);
      await signIn(provider);
    } catch (err) {
      console.error(`Sign in failed for ${provider}`, err);
      setLastLoginPreference(null);
    }
  };

  return (
    <div className="relative min-h-screen ef-landing-page flex items-center justify-center px-4 py-16">
      <div className="ef-landing-glow pointer-events-none fixed inset-x-0 top-0 h-[320px] z-0" />
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="ef-card p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-14 w-14 rounded-xl bg-(--surface-2) flex items-center justify-center mb-4">
              <Image className="h-9 w-9 object-contain" src="/logo.png" alt="" width={36} height={36} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-(--foreground)">
              Sign in to ExporaFlow
            </h1>
            <p className="text-sm text-(--muted-2) mt-1.5 leading-relaxed">
              Use your work account to access projects, tickets, and the store directory.
            </p>
          </div>

          <div className="space-y-2.5">
            <AuthButton
              btnTitle="Continue with Google"
              working
              lastUsed={lastLoginPreference === "google"}
              handleOnClickFunction={() => void signUp("google")}
            />
            <AuthButton
              btnTitle="Continue with GitHub"
              working
              lastUsed={lastLoginPreference === "github"}
              handleOnClickFunction={() => void signUp("github")}
            />
            <AuthButton btnTitle="Continue with SAML SSO" working={false} />
          </div>

          <p className="text-xs text-center text-(--muted-2) mt-6 leading-relaxed">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-(--accent) hover:underline">
              terms and conditions
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-xs text-(--muted-2) mt-4">
          <Link href="/" className="hover:text-(--foreground) transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
