import { Upload, RotateCcw, ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface FileUploadProps {
  onFile: (file: File) => void;
  loading: boolean;
  hasData: boolean;
  recordCount: number;
  onClearCache?: () => void;
  onClearAllData?: () => Promise<void>;
}

export function FileUpload({ onFile, loading, hasData, recordCount, onClearCache, onClearAllData }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleClearFile = () => {
    // Limpa apenas o arquivo em cache, mantém histórico
    localStorage.removeItem("routeIndex");
    onClearCache?.();
    setShowMenu(false);
  };

  const handleClearAll = () => {
    // Limpa arquivo e histórico (Supabase)
    onClearAllData?.();
    setShowMenu(false);
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
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent disabled:opacity-50"
              title="Menu de opções"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Opções
              <ChevronDown className="h-3 w-3" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-card shadow-lg z-10">
                <button
                  onClick={handleClearFile}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-accent first:rounded-t-lg transition-colors"
                >
                  <div className="font-semibold">Carregar novo arquivo</div>
                  <div className="text-muted-foreground text-[10px]">Mantém o histórico</div>
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-accent last:rounded-b-lg transition-colors"
                >
                  <div className="font-semibold">Limpar tudo</div>
                  <div className="text-muted-foreground text-[10px]">Reseta arquivo e dados</div>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
