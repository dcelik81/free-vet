"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (profile?.profileComplete === false) router.replace("/onboarding");
    else if (profile?.role === "vet") router.replace("/requests");
    else router.replace("/vets");
  }, [loading, user, profile, router]);

  async function onSignIn() {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      // AuthProvider will handle user doc + profile subscription and routing.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş yapılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <Card className="w-full shadow-sm">
          <div className="flex items-center gap-3 p-8 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle>Free Vet</CardTitle>
                <CardDescription>
                  Veteriner bulmak veya veteriner olarak yardımcı olmak için
                  giriş yap.
                </CardDescription>
              </CardHeader>
            </div>
          </div>

          <CardContent className="px-8 pb-8 pt-2">
            <Button
              type="button"
              onClick={onSignIn}
              disabled={submitting || loading}
              className="w-full"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? "Giriş yapılıyor…" : "Google ile devam et"}
            </Button>

            {error ? (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            ) : null}

            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Devam ederek bir hesap oluşturur ve kısa bir profil tamamlarsın.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
