import type { Metadata } from "next";
import { MobileSurface } from "@/components/mobile/mobile-surface";

export const metadata: Metadata = { title: "Audience mobile" };

export default function MobilePage() {
  return <MobileSurface />;
}
