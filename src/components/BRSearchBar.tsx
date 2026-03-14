import { Search } from "lucide-react";
import { useRef } from "react";
import type { FilterMode } from "@/lib/routeData";

interface BRSearchBarProps {
  brInput: string;
  onBRChange: (val: string) => void;
  filter: FilterMode;
  onFilterChange: (val: FilterMode) => void;
  onSearch: () => void;
  disabled: boolean;
}

export function BRSearchBar({ brInput, onBRChange, filter, onFilterChange, onSearch, disabled }: BRSearchBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-separate concatenated BRs (scanners that don't send Enter)
  const handleChange = (val: string) => {
    const formatted = val.replace(/([^\n,\s])(BR)/gi, '$1\n$2');
    onBRChange(formatted);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">BRs (bipe ou cole — cada BR em uma linha)</label>
        <textarea
          ref={textareaRef}
          value={brInput}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Bipe os códigos BR aqui...&#10;Cada leitura vai para uma nova linha"
          rows={3}
          className="w-full rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
        />
      </div>
      <div className="flex items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Filtro</label>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as FilterMode)}
            className="rounded-lg border bg-card px-3 py-2.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="cluster">Cluster</option>
            <option value="bairro">Bairro</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
        <button
          onClick={onSearch}
          disabled={disabled}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </div>
    </div>
  );
}
