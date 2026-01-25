"use client";

import { CircleUser, ClipboardList, LogOut, Stethoscope } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function AppHeader() {
  const { profile, signOut } = useAuth();
  const homeHref = profile?.role === "vet" ? "/requests" : "/vets";

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
        <Link href={homeHref} className="text-sm font-semibold tracking-tight">
          Ücretsiz Veteriner
        </Link>

        <nav className="flex items-center gap-2">
          {profile?.role !== "vet" ? (
            <NavLink
              href="/vets"
              label="Veterinerler"
              icon={<Stethoscope className="h-4 w-4" />}
            />
          ) : null}
          <NavLink
            href="/requests"
            label="İstekler"
            icon={<ClipboardList className="h-4 w-4" />}
          />
          <NavLink
            href="/profil"
            label="Profil"
            icon={<CircleUser className="h-4 w-4" />}
          />
        </nav>

        <div className="flex items-center gap-3">
          {profile?.role ? (
            <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
              {profile.role === "vet" ? "Veteriner" : "Kullanıcı"}
            </span>
          ) : null}
          <Button type="button" onClick={signOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
