"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  BadgeCheck,
  Building2,
  Camera,
  CircleUser,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { storage } from "@/lib/firebase";
import { updateUserProfile } from "@/lib/users";

function ProfilInner() {
  const { user, profile } = useAuth();
  const isVet = profile?.role === "vet";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clinicAddress, setClinicAddress] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (profile?.clinicAddress != null) {
      setClinicAddress(profile.clinicAddress);
    }
  }, [profile?.clinicAddress]);

  const displayName = useMemo(() => {
    return profile?.displayName ?? profile?.email ?? "—";
  }, [profile]);

  const location = useMemo(() => {
    return [profile?.city, profile?.province, profile?.country]
      .filter(Boolean)
      .join(", ");
  }, [profile]);

  const vetStatus = profile?.vetStatus;
  const isOpen =
    vetStatus === "open" ||
    (vetStatus == null &&
      (profile as unknown as { available?: boolean }).available === true);

  async function toggleAvailability() {
    if (!user) return;
    if (!isVet) return;

    setSaving(true);
    setError(null);
    try {
      await updateUserProfile(user.uid, {
        vetStatus: isOpen ? "closed" : "open",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncelleme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    setError(null);

    try {
      const fileRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const photoURL = await getDownloadURL(fileRef);
      await updateUserProfile(user.uid, { photoURL });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fotoğraf yüklenemedi.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function saveClinicAddress() {
    if (!user || !isVet) return;

    setSavingAddress(true);
    setError(null);

    try {
      await updateUserProfile(user.uid, {
        clinicAddress: clinicAddress.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Adres kaydedilemedi.");
    } finally {
      setSavingAddress(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Profil bilgilerini görüntüle ve (veteriner isen) müsaitlik
              durumunu güncelle.
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CircleUser className="h-5 w-5" />
          </div>
        </div>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>Hesap</CardTitle>
            <CardDescription>Temel bilgiler</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Profile Photo */}
            <div className="grid gap-2">
              <div className="text-xs text-muted-foreground">
                Profil fotoğrafı
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                  {profile?.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt="Profil fotoğrafı"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CircleUser className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="h-4 w-4" />
                    {uploadingPhoto ? "Yükleniyor…" : "Fotoğraf değiştir"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-xs text-muted-foreground">Ad</div>
              <div className="text-sm font-medium">{displayName}</div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-muted-foreground">Rol</div>
              <div className="inline-flex items-center gap-2 text-sm font-medium">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                {isVet ? "Veteriner" : "Kullanıcı"}
              </div>
            </div>
            <div className="grid gap-1">
              <div className="text-xs text-muted-foreground">Konum</div>
              <div className="text-sm font-medium">
                {location || "Konum belirtilmemiş"}
              </div>
            </div>
          </CardContent>
        </Card>

        {isVet ? (
          <>
            <Card className="mt-6 shadow-sm">
              <CardHeader>
                <CardTitle>Müsaitlik</CardTitle>
                <CardDescription>
                  Kullanıcılar profilinde müsait olup olmadığını görecek.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  Durum:{" "}
                  <span className="font-medium">
                    {isOpen ? "Açık" : "Kapalı"}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={toggleAvailability}
                  disabled={saving}
                  variant="outline"
                >
                  {isOpen ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  {saving ? "Güncelleniyor…" : "Değiştir"}
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Klinik adresi
                </CardTitle>
                <CardDescription>
                  Kullanıcılar istek gönderirken bu adresi görecek.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Textarea
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="Klinik tam adresini gir"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={saveClinicAddress}
                    disabled={savingAddress}
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    {savingAddress ? "Kaydediliyor…" : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        ) : null}
      </main>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <RequireAuth>
      <ProfilInner />
    </RequireAuth>
  );
}
