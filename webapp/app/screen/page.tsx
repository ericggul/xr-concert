import type { Metadata } from "next";
import { ScreenSurface } from "@/components/screen/screen-surface";

export const metadata: Metadata = { title: "Projection screen" };

export default function ScreenPage() {
  return <ScreenSurface />;
}
