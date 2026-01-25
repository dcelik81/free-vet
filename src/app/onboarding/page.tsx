"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Building2,
  LogOut,
  MapPin,
  Save,
  Stethoscope,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { signOutUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { storage } from "@/lib/firebase";
import { type UserRole, updateUserProfile } from "@/lib/users";

function OnboardingInner() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [role, setRole] = useState<UserRole>("user");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!country.trim() || !province.trim() || !city.trim()) return false;
    return true;
  }, [country, province, city]);

  useEffect(() => {
    if (!profile) return;
    if (profile.role) setRole(profile.role);
    setCountry(profile.country ?? "");
    setProvince(profile.province ?? "");
    setCity(profile.city ?? "");
    setClinicAddress(profile.clinicAddress ?? "");
  }, [profile]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!profile?.profileComplete) return;
    if (profile.role === "vet") router.replace("/requests");
    else router.replace("/vets");
  }, [loading, user, profile, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!canSubmit) {
      setError("Lütfen ülke, il ve şehir alanlarını doldurun.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let photoURL: string | undefined;

      if (avatarFile) {
        const fileRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(fileRef, avatarFile, {
          contentType: avatarFile.type,
        });
        photoURL = await getDownloadURL(fileRef);
      }

      await updateUserProfile(user.uid, {
        role,
        country: country.trim(),
        province: province.trim(),
        city: city.trim(),
        clinicAddress: role === "vet" ? clinicAddress.trim() : undefined,
        vetStatus: role === "vet" ? "open" : undefined,
        profileComplete: true,
        ...(photoURL ? { photoURL } : null),
      });

      router.replace(role === "vet" ? "/requests" : "/vets");
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Profil kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Profilini tamamla
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bu işlem bir dakikadan kısa sürer.
            </p>
          </div>
          <Button
            type="button"
            onClick={signOutUser}
            variant="outline"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Çıkış yap
          </Button>
        </div>

        <Card className="mt-8 shadow-sm">
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle>Profil bilgileri</CardTitle>
              <CardDescription>Rolünü seç ve konumunu belirt.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Konum
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ülke"
                  />
                  <Input
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="İl"
                  />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Şehir"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {role === "vet" ? (
                    <Stethoscope className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  Rol
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      role === "user"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <div className="font-medium">Kullanıcı</div>
                    <div className="mt-1 text-xs opacity-80">
                      Veteriner arıyorum.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("vet")}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      role === "vet"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <div className="font-medium">Veteriner</div>
                    <div className="mt-1 text-xs opacity-80">
                      Kullanıcılara yardımcı olmak istiyorum.
                    </div>
                  </button>
                </div>
              </div>

              {role === "vet" ? (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    Klinik adresi (isteğe bağlı)
                  </div>
                  <Textarea
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    placeholder="Klinik tam adresini gir (kullanıcılar bu adresi görecek)"
                    className="mt-3"
                    rows={3}
                  />
                </div>
              ) : null}

              <div>
                <div className="text-sm font-medium">
                  Profil fotoğrafı (isteğe bağlı)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <Button type="submit" disabled={!canSubmit || submitting}>
                  <Save className="h-4 w-4" />
                  {submitting ? "Kaydediliyor…" : "Kaydet ve devam et"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth requireProfileComplete={false}>
      <OnboardingInner />
    </RequireAuth>
  );
}
