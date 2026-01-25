import { VetDetailClient } from "./vet-detail-client";

export default async function VetPage({
  params,
}: {
  params: { uid: string } | Promise<{ uid: string }>;
}) {
  const resolved = await Promise.resolve(params);
  return <VetDetailClient uid={resolved.uid} />;
}
