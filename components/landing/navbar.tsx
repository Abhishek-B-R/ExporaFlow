"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession, signOut } from "@/utils/auth";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Dashboard", href: "/workflow/dashboard" },
  { label: "Projects", href: "/workflow/project" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isLoggedIn = Boolean(session?.user?.id);
  const canUseApp = session?.user?.workspaceMember === true;

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-(--border) bg-(--surface-1)/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-2">
          <Image
            src="/logo.png"
            alt="ExporaFlow"
            width={32}
            height={32}
            className="size-8"
          />
          <span className="text-[15px] font-semibold tracking-tight text-(--foreground)">
            ExporaFlow
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {canUseApp
            ? NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "text-(--foreground) font-medium bg-(--surface-3)"
                      : "text-(--muted) hover:text-(--foreground) hover:bg-(--surface-3)/70"
                  }`}
                >
                  {link.label}
                </Link>
              ))
            : null}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              {canUseApp ? (
                <Link
                  href="/profile"
                  className="px-3 py-1.5 text-sm text-(--muted) hover:text-(--foreground) rounded-lg hover:bg-(--surface-3)/70 transition-colors"
                >
                  Profile
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => signOut()}
                className="px-3 py-1.5 text-sm text-(--muted) hover:text-(--foreground) rounded-lg hover:bg-(--surface-3)/70 transition-colors"
              >
                Sign out
              </button>
              {canUseApp ? (
                <Link href="/workflow/dashboard" className="ef-btn-primary h-9 rounded-lg px-4 text-sm">
                  Open app
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="px-3 py-1.5 text-sm text-(--muted) hover:text-(--foreground) rounded-lg hover:bg-(--surface-3)/70 transition-colors"
              >
                Sign in
              </Link>
              <Link href="/signup" className="ef-btn-primary h-9 rounded-lg px-4 text-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle — only on small screens */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden ml-auto inline-flex size-9 items-center justify-center rounded-lg border border-(--border) bg-(--surface-1) text-(--muted) hover:bg-(--surface-3) hover:text-(--foreground) transition-colors"
        >
          {mobileOpen ? <X className="size-[18px]" strokeWidth={2} /> : <Menu className="size-[18px]" strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="md:hidden border-t border-(--border) bg-(--surface-1) px-4 py-3 space-y-1">
          {canUseApp
            ? NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-(--foreground) hover:bg-(--surface-3) transition-colors"
                >
                  {link.label}
                </Link>
              ))
            : null}
          <div className="pt-2 mt-2 border-t border-(--border) flex flex-col gap-1">
            {isLoggedIn ? (
              <>
                {canUseApp ? (
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2.5 text-sm text-(--foreground) hover:bg-(--surface-3)"
                  >
                    Profile
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-(--foreground) hover:bg-(--surface-3)"
                >
                  Sign out
                </button>
                {canUseApp ? (
                  <Link
                    href="/workflow/dashboard"
                    className="ef-btn-primary mt-1 h-10 rounded-lg text-sm text-center flex items-center justify-center"
                  >
                    Open app
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="block rounded-lg px-3 py-2.5 text-sm text-(--foreground) hover:bg-(--surface-3)"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="ef-btn-primary mt-1 h-10 rounded-lg text-sm text-center flex items-center justify-center"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
