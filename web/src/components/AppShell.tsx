"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AppShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/projects/new", label: "New Project" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[rgba(255,253,248,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="brand-serif text-2xl tracking-tight text-[var(--accent)]">
              Property Video Pro
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {links.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {(title || action) && (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            {title ? (
              <h1 className="brand-serif text-4xl tracking-tight text-[var(--ink)]">
                {title}
              </h1>
            ) : (
              <div />
            )}
            {action}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
