// Minimal, dependency-free user-agent parsing — just enough for the admin
// analytics dashboard's device/browser/OS breakdowns. Not meant to be a
// precise UA-sniffing library (browsers lie in their UA strings on
// purpose); it's good enough for "mostly mobile vs desktop" and "mostly
// Chrome vs Safari" style charts, which is what an analytics page needs.

export type DeviceType = "Mobile" | "Tablet" | "Desktop";

export function parseUserAgent(ua: string | null | undefined): {
  device: DeviceType;
  browser: string;
  os: string;
} {
  const s = (ua ?? "").toLowerCase();

  let device: DeviceType = "Desktop";
  if (/ipad|tablet(?!.*mobile)/.test(s)) {
    device = "Tablet";
  } else if (/mobi|iphone|ipod|android.*mobile/.test(s)) {
    device = "Mobile";
  } else if (/android/.test(s)) {
    // "Android" without "Mobile" in the UA is Android's own signal for tablet.
    device = "Tablet";
  }

  let browser = "Other";
  if (/edg\//.test(s)) browser = "Edge";
  else if (/opr\/|opera/.test(s)) browser = "Opera";
  else if (/chrome\//.test(s) && !/chromium/.test(s)) browser = "Chrome";
  else if (/crios\//.test(s)) browser = "Chrome"; // Chrome on iOS
  else if (/fxios\//.test(s)) browser = "Firefox"; // Firefox on iOS
  else if (/firefox\//.test(s)) browser = "Firefox";
  else if (/safari\//.test(s) && !/chrome|chromium|crios/.test(s)) browser = "Safari";

  let os = "Other";
  if (/windows/.test(s)) os = "Windows";
  else if (/iphone|ipad|ipod/.test(s)) os = "iOS";
  else if (/android/.test(s)) os = "Android";
  else if (/mac os x|macintosh/.test(s)) os = "macOS";
  else if (/linux/.test(s)) os = "Linux";

  if (!ua) {
    browser = "Unknown";
    os = "Unknown";
  }

  return { device, browser, os };
}
