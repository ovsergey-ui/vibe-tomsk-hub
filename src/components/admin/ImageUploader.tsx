import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;

function extractPath(url: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

export function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Можно загружать только изображения");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Максимальный размер — 5 МБ");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    // Cleanup previous file
    const prev = extractPath(value);
    if (prev) {
      await supabase.storage.from(BUCKET).remove([prev]);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
    toast.success("Загружено");
  };

  const remove = async () => {
    const prev = extractPath(value);
    if (prev) {
      await supabase.storage.from(BUCKET).remove([prev]);
    }
    onChange(null);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-4 transition ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      }`}
    >
      {value ? (
        <div className="relative w-full">
          <img
            src={value}
            alt="Обложка"
            className="mx-auto max-h-56 rounded-xl object-contain"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={remove}
            disabled={busy}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
          <Upload className="h-6 w-6" />
          <div>Перетащите файл или нажмите кнопку</div>
          <div className="text-xs">JPG, PNG, WEBP — до 5 МБ</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка…
          </>
        ) : value ? (
          "Заменить файл"
        ) : (
          "Выбрать файл"
        )}
      </Button>
    </div>
  );
}