import { Download } from "lucide-react";
import * as XLSX from "xlsx";

export interface SwapHistoryEntry {
  DATA: string;
  Ciclo: string;
  RotaDE: string;
  ModalDE: string;
  RotaPARA: string;
  ModalPARA: string;
  QtdPacotes: string;
  BR: string;
  ATOrigem: string;
  ATDestino: string;
  Bairro: string;
}

interface SwapHistoryTableProps {
  entries: SwapHistoryEntry[];
  onClear: () => void;
}

function exportToExcel(entries: SwapHistoryEntry[]) {
  const headers = ["DATA", "Ciclo", "Rota - DE", "Modal - DE", "Rota - PARA", "Modal - PARA", "QTD. PACOTES", "BR", "AT ORIGEM", "AT DESTINO", "BAIRRO"];
  const rows = entries.map(e => [
    e.DATA, e.Ciclo, e.RotaDE, e.ModalDE, e.RotaPARA, e.ModalPARA, e.QtdPacotes, e.BR, e.ATOrigem, e.ATDestino, e.Bairro,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Set column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 18) }));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trocas");
  XLSX.writeFile(wb, `trocas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function SwapHistoryTable({ entries, onClear }: SwapHistoryTableProps) {
  if (entries.length === 0) return null;

  return (
    <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm font-bold">Histórico de Trocas</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {entries.length} troca(s)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToExcel(entries)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar Excel
          </button>
          <button
            onClick={onClear}
            className="rounded-lg border px-4 py-2 text-xs font-semibold transition-colors hover:bg-accent"
          >
            Limpar
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-2 font-medium">DATA</th>
              <th className="p-2 font-medium">Ciclo</th>
              <th className="p-2 font-medium">Rota - DE</th>
              <th className="p-2 font-medium">Modal - DE</th>
              <th className="p-2 font-medium">Rota - PARA</th>
              <th className="p-2 font-medium">Modal - PARA</th>
              <th className="p-2 font-medium">QTD. PACOTES</th>
              <th className="p-2 font-medium">BR</th>
              <th className="p-2 font-medium">AT ORIGEM</th>
              <th className="p-2 font-medium">AT DESTINO</th>
              <th className="p-2 font-medium">BAIRRO</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                <td className="p-2">{e.DATA}</td>
                <td className="p-2">{e.Ciclo}</td>
                <td className="p-2 font-mono">{e.RotaDE}</td>
                <td className="p-2">{e.ModalDE}</td>
                <td className="p-2 font-mono">{e.RotaPARA}</td>
                <td className="p-2">{e.ModalPARA}</td>
                <td className="p-2 text-center">{e.QtdPacotes}</td>
                <td className="p-2 font-mono">{e.BR}</td>
                <td className="p-2 font-mono">{e.ATOrigem}</td>
                <td className="p-2 font-mono">{e.ATDestino}</td>
                <td className="p-2">{e.Bairro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
