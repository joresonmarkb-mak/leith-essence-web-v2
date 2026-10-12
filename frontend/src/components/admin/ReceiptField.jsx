import { useState } from "react";
import { uploadFile } from "../../lib/upload.js";
import { btnGhost } from "./ui.js";

export default function ReceiptField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadFile(file, "expense"));
    } catch (err) {
      setError(err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="text-xs text-muted">
      Receipt (optional)
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <label className={`${btnGhost} cursor-pointer`}>
          {uploading ? "Uploading..." : value ? "Replace" : "Upload photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" disabled={uploading} />
        </label>
        {value && (
          <>
            <a href={value} target="_blank" rel="noreferrer" className="text-fg underline">View receipt</a>
            <button type="button" onClick={() => onChange("")} className="underline">Remove</button>
          </>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}