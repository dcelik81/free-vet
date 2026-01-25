"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { ChevronRight, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { RequireAuth } from "@/components/RequireAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/users";

function VetsInner() {
  const [vets, setVets] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "vet"));
    const unsub = onSnapshot(q, (snap) => {
      setVets(
        snap.docs.map((d) => ({
          uid: (d.data() as Partial<UserProfile>).uid ?? d.id,
          ...(d.data() as UserProfile),
        })),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const visibleVets = useMemo(
    () => vets.filter((v) => v.profileComplete === true),
    [vets],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Veteriner bul
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Veterinerleri incele ve bir istek gönder.
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>

        <Card className="mt-6 shadow-sm">
          {loading ? (
            <CardContent className="p-6 text-sm text-muted-foreground">
              Veterinerler yükleniyor…
            </CardContent>
          ) : visibleVets.length === 0 ? (
            <CardHeader>
              <CardTitle>Henüz veteriner yok</CardTitle>
              <CardDescription>
                Veteriner isen profilini tamamla ve listede görün.
              </CardDescription>
            </CardHeader>
          ) : (
            <ul className="divide-y divide-border">
              {visibleVets.map((vet) => (
                <li key={vet.uid}>
                  <Link
                    href={`/vets/${vet.uid}`}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {vet.displayName ?? vet.email ?? "Veteriner"}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {[vet.city, vet.province, vet.country]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function VetsPage() {
  return (
    <RequireAuth allowedRoles={["user"]} unauthorizedRedirectTo="/requests">
      <VetsInner />
    </RequireAuth>
  );
}
