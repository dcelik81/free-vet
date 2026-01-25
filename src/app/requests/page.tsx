"use client";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Check, ImageIcon, Mail, Send, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/users";

type RequestStatus = "accepted" | "rejected" | "open" | "closed";

type VetRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  message: string;
  /** URLs of uploaded images */
  images?: string[];
  status?: RequestStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function getStatusLabel(status: RequestStatus | undefined): string {
  switch (status) {
    case undefined:
      return "beklemede";
    case "open":
      return "beklemede";
    case "accepted":
      return "kabul edildi";
    case "rejected":
      return "reddedildi";
    case "closed":
      return "kapalı";
    default:
      return status;
  }
}

function RequestsInner() {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";
  const isVet = profile?.role === "vet";

  const [tab, setTab] = useState<"incoming" | "sent">(
    profile?.role === "vet" ? "incoming" : "sent",
  );
  const [incoming, setIncoming] = useState<VetRequest[]>([]);
  const [sent, setSent] = useState<VetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!uid) return;

    setLoading(true);
    const unsubs: Array<() => void> = [];

    if (isVet) {
      const incomingQ = query(
        collection(db, "requests"),
        where("toUid", "==", uid),
      );
      const unsubIncoming = onSnapshot(incomingQ, (snap) => {
        setIncoming(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<VetRequest, "id">),
          })),
        );
        setLoading(false);
      });
      unsubs.push(unsubIncoming);
      setSent([]);
    } else {
      const sentQ = query(
        collection(db, "requests"),
        where("fromUid", "==", uid),
      );
      const unsubSent = onSnapshot(sentQ, (snap) => {
        setSent(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<VetRequest, "id">),
          })),
        );
        setLoading(false);
      });
      unsubs.push(unsubSent);
      setIncoming([]);
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [uid, isVet]);

  useEffect(() => {
    if (isVet) setTab("incoming");
    else setTab("sent");
  }, [isVet]);

  const active = tab === "incoming" ? incoming : sent;

  const counterpartUids = useMemo(() => {
    const set = new Set<string>();
    for (const r of active) {
      const other = tab === "incoming" ? r.fromUid : r.toUid;
      if (other) set.add(other);
    }
    return Array.from(set);
  }, [active, tab]);

  useEffect(() => {
    let cancelled = false;

    async function loadMissingPeople() {
      const missing = counterpartUids.filter((id) => !people[id]);
      if (missing.length === 0) return;

      const entries = await Promise.all(
        missing.map(async (id) => {
          const snap = await getDoc(doc(db, "users", id));
          return [
            id,
            snap.exists() ? (snap.data() as UserProfile) : null,
          ] as const;
        }),
      );

      if (cancelled) return;
      setPeople((prev) => {
        const next = { ...prev };
        for (const [id, p] of entries) {
          if (p) next[id] = p;
        }
        return next;
      });
    }

    void loadMissingPeople();
    return () => {
      cancelled = true;
    };
  }, [counterpartUids, people]);

  async function setStatus(
    requestId: string,
    status: Exclude<RequestStatus, "open" | "closed">,
  ) {
    await updateDoc(doc(db, "requests", requestId), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">İstekler</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gelen ve gönderilen mesajlar.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1">
            {isVet ? (
              <button
                type="button"
                onClick={() => setTab("incoming")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === "incoming"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                <Mail className="h-4 w-4" />
                Gelen
              </button>
            ) : null}
            {!isVet ? (
              <button
                type="button"
                onClick={() => setTab("sent")}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === "sent"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                <Send className="h-4 w-4" />
                Gönderilen
              </button>
            ) : null}
          </div>
        </div>

        <Card className="mt-6 shadow-sm">
          {loading ? (
            <CardContent className="p-6 text-sm text-muted-foreground">
              İstekler yükleniyor…
            </CardContent>
          ) : active.length === 0 ? (
            <CardHeader>
              <CardTitle>
                {tab === "incoming"
                  ? "Gelen istek yok"
                  : "Gönderilen istek yok"}
              </CardTitle>
              <CardDescription>
                {isVet ? (
                  "Henüz bir isteğin yok."
                ) : (
                  <>
                    <Link href="/vets" className="font-medium underline">
                      Veterinerleri görüntüle
                    </Link>{" "}
                    ve bir istek gönder.
                  </>
                )}
              </CardDescription>
            </CardHeader>
          ) : (
            <ul className="divide-y divide-border">
              {active.map((r) => {
                const otherUid = tab === "incoming" ? r.fromUid : r.toUid;
                const other = people[otherUid];
                const title =
                  other?.displayName ?? other?.email ?? otherUid.slice(0, 8);

                return (
                  <li key={r.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{title}</div>
                        <div className="mt-1 text-sm text-foreground">
                          {r.message}
                        </div>

                        {/* Display images if they exist (for vets viewing incoming requests) */}
                        {r.images && r.images.length > 0 ? (
                          <div className="mt-3">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <ImageIcon className="h-3 w-3" />
                              {r.images.length} fotoğraf
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {r.images.map((url) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative h-20 w-20 overflow-hidden rounded-lg border border-border hover:opacity-80 transition-opacity"
                                >
                                  <Image
                                    src={url}
                                    alt="Fotoğraf"
                                    fill
                                    className="object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-2 text-xs text-muted-foreground">
                          Durum:{" "}
                          <span
                            className={
                              r.status === "accepted"
                                ? "font-medium text-emerald-600"
                                : r.status === "rejected"
                                  ? "font-medium text-red-600"
                                  : "font-medium"
                            }
                          >
                            {getStatusLabel(r.status)}
                          </span>
                        </div>
                      </div>

                      {tab === "incoming" ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setStatus(r.id, "accepted")}
                            disabled={
                              r.status === "accepted" || r.status === "rejected"
                            }
                            className="bg-emerald-600 text-white hover:bg-emerald-500"
                            size="sm"
                          >
                            <Check className="h-4 w-4" />
                            Kabul et
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setStatus(r.id, "rejected")}
                            disabled={
                              r.status === "accepted" || r.status === "rejected"
                            }
                            variant="secondary"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                            Reddet
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <RequireAuth>
      <RequestsInner />
    </RequireAuth>
  );
}
