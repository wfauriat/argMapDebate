"use client";

import dynamic from "next/dynamic";

const ArgumentMapper = dynamic(
  () => import("@/components/ArgumentMapper"),
  { ssr: false }
);

export default function Home() {
  return <ArgumentMapper />;
}
