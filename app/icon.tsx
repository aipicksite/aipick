import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#3E2A5C",
          borderRadius: 9,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 2.5,
          padding: "6px 6px 5px",
        }}
      >
        <div style={{ width: 4.5, height: 9, borderRadius: 1.5, background: "#C68A28" }} />
        <div style={{ width: 4.5, height: 14, borderRadius: 1.5, background: "#F4E3BE" }} />
        <div style={{ width: 4.5, height: 20, borderRadius: 1.5, background: "#C68A28" }} />
      </div>
    ),
    { ...size }
  );
}
