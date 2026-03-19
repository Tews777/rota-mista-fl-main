import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface HeaderFileUploadProps {
  onFile: (file: File) => void;
  loading: boolean;
}

export function HeaderFileUpload({ onFile, loading }: HeaderFileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onFile(f);
            // Limpar o input para permitir selecionar o mesmo arquivo novamente
            if (ref.current) {
              ref.current.value = "";
            }
          }
        }}
      />
      <Button
        onClick={() => ref.current?.click()}
        disabled={loading}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        title="Fazer upload de novo arquivo"
      >
        <Upload className="h-4 w-4" />
      </Button>
    </>
  );
}
