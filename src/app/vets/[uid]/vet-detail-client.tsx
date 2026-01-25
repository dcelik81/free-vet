"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleUser,
  ImagePlus,
  MapPin,
  Send,
  Stethoscope,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { db, storage } from "@/lib/firebase";
import type { UserProfile } from "@/lib/users";

function VetDetailInner({ uid }: { uid?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [vet, setVet] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setVet(null);
      setLoading(false);
      setError("Geçersiz veteriner bağlantısı.");
      return;
    }

    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      setVet(snap.exists() ? (snap.data() as UserProfile) : null);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const location = useMemo(() => {
    if (!vet) return "";
    return [vet.city, vet.province, vet.country].filter(Boolean).join(", ");
  }, [vet]);

  const mapUrl = useMemo(() => {
    if (!vet?.clinicAddress) return null;
    const encodedAddress = encodeURIComponent(vet.clinicAddress);
    return `https://maps.google.com/maps?q=${encodedAddress}&output=embed&zoom=15`;
  }, [vet?.clinicAddress]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Limit total images to 5
    const newFiles = files.slice(0, 5 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...newFiles]);

    // Generate previews
    for (const file of newFiles) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreviews((prev) => [...prev, ev.target?.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!uid) return;
    if (user.uid === uid) {
      setError("Kendine istek gönderemezsin.");
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Önce kısa bir mesaj yaz.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload images first
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const timestamp = Date.now();
        const fileRef = ref(
          storage,
          `requests/${user.uid}/${timestamp}-${i}-${file.name}`,
        );
        await uploadBytes(fileRef, file, { contentType: file.type });
        const url = await getDownloadURL(fileRef);
        imageUrls.push(url);
      }

      await addDoc(collection(db, "requests"), {
        fromUid: user.uid,
        toUid: uid,
        message: trimmed,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage("");
      setImageFiles([]);
      setImagePreviews([]);
      setSuccess("İstek gönderildi.");
      // Optionally jump to requests page after sending.
      setTimeout(() => router.push("/requests"), 500);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "İstek gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/vets">
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Link>
          </Button>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>

        <Card className="mt-6 shadow-sm">
          {loading ? (
            <CardContent className="p-6 text-sm text-muted-foreground">
              Veteriner yükleniyor…
            </CardContent>
          ) : !vet ? (
            <CardContent className="p-6 text-sm text-muted-foreground">
              {error ?? "Veteriner bulunamadı."}
            </CardContent>
          ) : (
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  {/* Vet Profile Photo */}
                  <div className="mb-4 flex items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                      {vet.photoURL ? (
                        <Image
                          src={vet.photoURL}
                          alt={vet.displayName ?? "Veteriner"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <CircleUser className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardHeader className="p-0">
                        <CardTitle className="text-xl">
                          {vet.displayName ?? vet.email ?? "Veteriner"}
                        </CardTitle>
                        <div className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                          {vet.vetStatus === "open" ||
                          ((vet as unknown as { available?: boolean })
                            .available === true &&
                            vet.vetStatus == null) ? (
                            <>
                              <BadgeCheck className="h-4 w-4" />
                              Açık
                            </>
                          ) : vet.vetStatus === "closed" ||
                            ((vet as unknown as { available?: boolean })
                              .available === false &&
                              vet.vetStatus == null) ? (
                            <>
                              <XCircle className="h-4 w-4" />
                              Kapalı
                            </>
                          ) : (
                            "Durum bilinmiyor"
                          )}
                        </div>
                      </CardHeader>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {location || "Konum belirtilmemiş"}
                  </p>

                  {/* Clinic Address */}
                  {vet.clinicAddress ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-lg border border-border bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          Klinik adresi
                        </div>
                        <p className="mt-1 text-sm">{vet.clinicAddress}</p>
                      </div>

                      {/* Google Maps Embed */}
                      {mapUrl ? (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 border-b border-border">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Haritada göster
                            </span>
                          </div>
                          <iframe
                            src={mapUrl}
                            width="100%"
                            height="300"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full"
                            title="Klinik konumu"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="text-sm font-medium">İstek gönder</div>
                  <form onSubmit={onSendRequest} className="mt-3 grid gap-3">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="İhtiyacını kısaca yaz…"
                      className="resize-none"
                    />

                    {/* Image upload */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Fotoğraf ekle (isteğe bağlı, en fazla 5)
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2">
                        {imagePreviews.map((preview, idx) => (
                          <div
                            key={preview}
                            className="relative h-16 w-16 overflow-hidden rounded-lg border border-border"
                          >
                            <Image
                              src={preview}
                              alt={`Fotoğraf ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {imageFiles.length < 5 ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <ImagePlus className="h-5 w-5" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {error ? (
                      <p className="text-sm text-destructive">{error}</p>
                    ) : null}
                    {success ? (
                      <p className="text-sm text-emerald-700">{success}</p>
                    ) : null}

                    <Button type="submit" disabled={submitting}>
                      <Send className="h-4 w-4" />
                      {submitting ? "Gönderiliyor…" : "İsteği gönder"}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}

export function VetDetailClient({ uid }: { uid?: string }) {
  return (
    <RequireAuth allowedRoles={["user"]} unauthorizedRedirectTo="/requests">
      <VetDetailInner uid={uid} />
    </RequireAuth>
  );
}
