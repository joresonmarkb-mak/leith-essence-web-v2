import { useEffect, useState } from "react";
import Dialog from "./Dialog.jsx";
import { api } from "../../lib/api.js";
import { uploadFile } from "../../lib/upload.js";
import { useSubmit, Err, Actions } from "./BatchForms.jsx";
import { input, labelCls, btnGhost, asList } from "./ui.js";

const WEAR = [["cool", "Cool weather"], ["summer", "Summer"], ["day", "Day"], ["night", "Night"]];

function PerfumeForm({ perfume, onClose, onSaved }) {
  const [name, setName] = useState(perfume?.name ?? "");
  const [inspiredBy, setInspiredBy] = useState(perfume?.inspiredBy ?? "");
  const [description, setDescription] = useState(perfume?.description ?? "");
  const [category, setCategory] = useState(perfume?.category ?? "for_him");
  const [intensity, setIntensity] = useState(perfume?.intensity ?? "moderate");
  const [wear, setWear] = useState(perfume?.whenToWear ?? []);
  const [imageUrl, setImageUrl] = useState(perfume?.imageUrl ?? "");
  const [noteIds, setNoteIds] = useState(
    [...(perfume?.notes ?? []).map((n) => String(n.id)), "", "", ""].slice(0, 3)
  );
  const [notes, setNotes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    api("/notes").then((d) => setNotes(asList(d, "notes"))).catch(() => {});
  }, []);

  // keep the perfume's current notes selectable even if the list is short
  const options = [...notes, ...(perfume?.notes ?? [])].filter(
    (n, i, all) => all.findIndex((x) => x.id === n.id) === i
  );

  const toggleWear = (k) => setWear((w) => (w.includes(k) ? w.filter((x) => x !== k) : [...w, k]));
  const setNote = (i, v) => setNoteIds((ids) => ids.map((x, j) => (j === i ? v : x)));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      setImageUrl(await uploadFile(file, "perfume"));
    } catch (err) {
      setUploadError(err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const { busy, error, submit } = useSubmit(async () => {
    const body = {
      name,
      inspiredBy,
      description,
      category,
      intensity,
      whenToWear: wear,
      imageUrl: imageUrl || null,
      noteIds: noteIds.map(Number),
    };
    const saved = perfume
      ? await api(`/perfumes/${perfume.id}`, { method: "PUT", body })
      : await api("/perfumes", { method: "POST", body });
    onSaved(saved);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>Perfume name
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Prince Noir" required />
        </label>
        <label className={labelCls}>Inspired by
          <input className={input} value={inspiredBy} onChange={(e) => setInspiredBy(e.target.value)} placeholder="Creed Aventus" />
        </label>
        <label className={labelCls}>Category
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="for_him">For him</option>
            <option value="for_her">For her</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label className={labelCls}>How noticeable
          <select className={input} value={intensity} onChange={(e) => setIntensity(e.target.value)}>
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="strong">Strong</option>
          </select>
        </label>
      </div>

      <label className={labelCls}>Description
        <textarea className={`${input} h-24 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <fieldset>
        <legend className="text-xs text-muted">When to wear</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEAR.map(([k, label]) => (
            <label
              key={k}
              className={`flex min-h-[44px] cursor-pointer items-center rounded-full border px-4 text-xs transition ${
                wear.includes(k) ? "border-accent bg-accent text-accent-fg" : "border-line text-muted"
              }`}
            >
              <input type="checkbox" className="sr-only" checked={wear.includes(k)} onChange={() => toggleWear(k)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs text-muted">Three main notes</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {noteIds.map((v, i) => (
            <select key={i} aria-label={`Note ${i + 1}`} className={input} value={v} onChange={(e) => setNote(i, e.target.value)} required>
              <option value="">Note {i + 1}</option>
              {options.map((n) => (
                <option key={n.id} value={n.id} disabled={noteIds.some((x, j) => j !== i && x === String(n.id))}>{n.name}</option>
              ))}
            </select>
          ))}
        </div>
        {options.length === 0 && <p className="mt-2 text-xs text-warn">No notes found yet. Notes have to exist before a perfume can use them.</p>}
      </fieldset>

      <div className="text-xs text-muted">
        Bottle photo
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          {imageUrl && <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg border border-line bg-bg object-contain" />}
          <label className={`${btnGhost} cursor-pointer`}>
            {uploading ? "Uploading..." : imageUrl ? "Replace" : "Upload photo"}
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" disabled={uploading} />
          </label>
          {imageUrl && <button type="button" onClick={() => setImageUrl("")} className="underline">Remove</button>}
        </div>
        {uploadError && <p role="alert" className="mt-2 text-sm text-danger">{uploadError}</p>}
      </div>

      <Err msg={error} />
      <Actions onClose={onClose} busy={busy || uploading} label={perfume ? "Save" : "Add perfume"} />
    </form>
  );
}

export function PerfumeFormDialog({ open, onClose, perfume, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title={perfume ? "Edit perfume" : "New perfume"} wide>
      <PerfumeForm perfume={perfume} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}