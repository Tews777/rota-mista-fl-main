import { Upload, RotateCcw } from "lucide-react";
import { useRef } from "react";

interface FileUploadProps {
  onFile: (file: File) => void;
  loading: boolean;
  hasData: boolean;
  recordCount: number;
  onClearCache?: () => void;
}

export function FileUpload({ onFile, loading, hasData, recordCount, onClearCache }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleClearCache = () => {
    localStorage.removeItem("routeIndex");
    onClearCache?.();
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {loading ? "Carregando..." : "Upload Planilha"}
      </button>
      {hasData && (
        <>
          <span className="text-xs text-muted-foreground">
            {recordCount.toLocaleString()} registros carregados
          </span>
          <button
            onClick={handleClearCache}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent disabled:opacity-50"
            title="Carregar novo arquivo (limpar cache)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Novo
          </button>
        </>
      )}
    </div>
  );
}
