import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "#f0f0f0",
          letterSpacing: "0.5px"
        }}
      >
        MS
      </div>
    ),
    { ...size }
  );
}
