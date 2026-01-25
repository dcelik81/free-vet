"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { UserRole } from "@/lib/users";

export function RequireAuth({
  children,
  requireProfileComplete = true,
  allowedRoles,
  unauthorizedRedirectTo = "/requests",
}: {
  children: React.ReactNode;
  requireProfileComplete?: boolean;
  allowedRoles?: UserRole[];
  unauthorizedRedirectTo?: string;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== "/login") router.replace("/login");
      return;
    }

    if (!requireProfileComplete) return;
    if (pathname === "/onboarding") return;

    if (profile && profile.profileComplete === false) {
      router.replace("/onboarding");
      return;
    }

    if (allowedRoles) {
      if (!profile?.role) return;
      if (!allowedRoles.includes(profile.role)) {
        router.replace(unauthorizedRedirectTo);
      }
    }
  }, [
    loading,
    user,
    profile,
    pathname,
    router,
    requireProfileComplete,
    allowedRoles,
    unauthorizedRedirectTo,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (requireProfileComplete && pathname !== "/onboarding") {
    if (!profile) return null;
    if (profile.profileComplete === false) return null;
  }

  if (allowedRoles) {
    if (!profile?.role) return null;
    if (!allowedRoles.includes(profile.role)) return null;
  }

  return <>{children}</>;
}
