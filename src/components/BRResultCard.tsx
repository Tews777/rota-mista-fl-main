import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { useState } from "react";
import type { RouteRecord, SwapLabel } from "@/lib/routeData";

interface BRResultCardProps {
  br: string;
  records: RouteRecord[];
  suggestions: RouteRecord[];
  selectedSwaps: Map<string, RouteRecord>;
  onToggleSwap: (at: string, rec: RouteRecord | null) => void;
  originalRecord: RouteRecord;
}

function RecordTable({ records, showCheckbox, selectedSwaps, onToggleSwap }: {
  records: RouteRecord[];
  showCheckbox?: boolean;
  selectedSwaps?: Map<string, RouteRecord>;
  onToggleSwap?: (at: string, rec: RouteRecord | null) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {showCheckbox && <th className="p-2 w-8"></th>}
            <th className="p-2 font-medium">AT</th>
            <th className="p-2 font-medium">Gaiola</th>
            <th className="p-2 font-medium">BR</th>
            <th className="p-2 font-medium">Tipo de Veículo</th>
            <th className="p-2 font-medium">SPR</th>
            <th className="p-2 font-medium">Cidade</th>
            <th className="p-2 font-medium">Cluster</th>
            <th className="p-2 font-medium">Bairro</th>
            <th className="p-2 font-medium">Paradas</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={`${r.AT}-${r.BR}-${i}`} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
              {showCheckbox && (
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedSwaps?.has(r.AT) ?? false}
                    onChange={(e) => onToggleSwap?.(r.AT, e.target.checked ? r : null)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </td>
              )}
              <td className="p-2 font-mono font-semibold">{r.AT}</td>
              <td className="p-2">{r.Gaiola}</td>
              <td className="p-2 font-mono">{r.BR}</td>
              <td className="p-2">{r.TipoVeiculo}</td>
              <td className="p-2">{r.SPR}</td>
              <td className="p-2">{r.Cidade}</td>
              <td className="p-2">
                <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{r.Cluster}</span>
              </td>
              <td className="p-2">{r.Bairro}</td>
              <td className="p-2 text-center">{r.Paradas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BRResultCard({ br, records, suggestions, selectedSwaps, onToggleSwap, originalRecord }: BRResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary px-3 py-1 font-display text-sm font-bold text-primary-foreground">
            {br}
          </span>
          <span className="text-xs text-muted-foreground">
            {suggestions.length} sugestão(ões)
          </span>
        </div>
      </div>

      {/* Original record */}
      <div className="px-4 py-2">
        <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registro Original</p>
        <RecordTable records={records} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t px-4 py-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center gap-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Sugestões de Troca ({suggestions.length})
          </button>
          {expanded && (
            <RecordTable
              records={suggestions}
              showCheckbox
              selectedSwaps={selectedSwaps}
              onToggleSwap={onToggleSwap}
            />
          )}
        </div>
      )}
    </div>
  );
}
