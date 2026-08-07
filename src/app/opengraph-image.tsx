import { brand } from "@/config/brand";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ЦКР — Центр комплексных решений";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: brand.colors.background,
          color: brand.colors.foreground,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 8,
            color: brand.colors.accent,
            textTransform: "uppercase",
          }}
        >
          {brand.name}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {brand.fullName}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: brand.colors.muted,
            maxWidth: 800,
          }}
        >
          {brand.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
