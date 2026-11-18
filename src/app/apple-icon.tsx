import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 72,
          color: "#f0f0f0",
          letterSpacing: "2px"
        }}
      >
        MS
      </div>
    ),
    { ...size }
  );
}
