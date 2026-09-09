"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ScreenshotUploader({
  onUploaded,
  fieldName = "requested_screenshot_url",
}: {
  onUploaded?: (url: string) => void;
  fieldName?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image under 5MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `screenshots/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("tool-media")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError("Upload failed — try a different image.");
        return;
      }

      const { data } = supabase.storage.from("tool-media").getPublicUrl(path);
      setUrl(data.publicUrl);
      onUploaded?.(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={fieldName} value={url ?? ""} />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        disabled={uploading}
        className="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-line file:bg-white file:text-sm file:font-medium hover:file:border-plum file:cursor-pointer"
      />
      {uploading && <p className="text-xs text-ink/50 mt-1.5">Uploading…</p>}
      {error && <p className="text-xs text-coral mt-1.5">{error}</p>}
      {url && !uploading && (
        <div className="mt-2 rounded-md overflow-hidden border border-line max-w-xs">
          <img src={url} alt="Screenshot preview" className="w-full h-auto" />
        </div>
      )}
    </div>
  );
}
