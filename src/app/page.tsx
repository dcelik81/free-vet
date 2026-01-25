"use client";

import { HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (profile?.profileComplete === false) router.replace("/onboarding");
    else if (profile?.role === "vet") router.replace("/requests");
    else router.replace("/vets");
  }, [loading, user, profile, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <Card className="w-full shadow-sm">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Free Vet</CardTitle>
                <CardDescription>
                  Kullanıcıları veterinerlerle buluşturan bir platform.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-2">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/login">Giriş yap</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/vets">Veterinerleri görüntüle</Link>
              </Button>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-muted-foreground">Yükleniyor…</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
