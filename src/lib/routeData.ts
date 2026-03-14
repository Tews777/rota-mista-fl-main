import * as XLSX from "xlsx";

export interface RouteRecord {
  AT: string;
  Gaiola: string;
  BR: string;
  TipoVeiculo: string;
  Bairro: string;
  Cidade: string;
  SPR: string;
  Cluster: string;
  Paradas: string;
}

export interface RouteIndex {
  records: RouteRecord[];
  indexBR: Map<string, RouteRecord[]>;
  indexCluster: Map<string, RouteRecord[]>;
  indexBairro: Map<string, RouteRecord[]>;
}

function normalizeColName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s]+/g, " ").trim();
}

function findColIndex(headers: string[], possibleNames: string[]): number {
  const nh = headers.map(h => h ? normalizeColName(String(h)) : "");
  const nn = possibleNames.map(normalizeColName);
  for (const n of nn) { const i = nh.indexOf(n); if (i !== -1) return i; }
  for (const n of nn) { const i = nh.findIndex(h => h.startsWith(n)); if (i !== -1) return i; }
  for (const n of nn) { const i = nh.findIndex(h => h.includes(n)); if (i !== -1) return i; }
  return -1;
}

const COL_NAMES: Record<keyof typeof DEFAULT_COL, string[]> = {
  AT: ["task id", "at", "taskid", "at destino", "at origem"],
  Gaiola: ["corridor-cage/route", "corridor-cage", "cage", "gaiola", "rota", "rota - de", "rota de", "corridor"],
  BR: ["spx tracking num", "br", "tracking number", "spx tracking"],
  TipoVeiculo: ["vehicle type", "tipo veiculo", "tipo de veiculo", "tipoveiculo", "modal", "modal - de", "modal de"],
  Bairro: ["neighborhood", "bairro"],
  Cidade: ["city", "cidade"],
  SPR: ["number of order/to", "number of order", "spr", "qtd order"],
  Cluster: ["cluster"],
  Paradas: ["number of stops", "paradas", "qtd. pacotes", "qtd pacotes"],
};

const DEFAULT_COL = {
  AT: 0,
  Gaiola: 3,
  BR: 4,
  TipoVeiculo: 12,
  Bairro: 25,
  Cidade: 23,
  SPR: 2,
  Cluster: 24,
  Paradas: 26,
} as const;

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

export function parseFile(file: File): Promise<RouteIndex> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Detect columns from header row
        const headerRow = (rows[0] ?? []).map(v => String(v ?? ""));
        console.log("Headers detectados:", headerRow.map((h, i) => `${i}:${h}`).join(" | "));
        const COL: Record<string, number> = {};
        for (const [key, names] of Object.entries(COL_NAMES)) {
          const idx = findColIndex(headerRow, names);
          COL[key] = idx !== -1 ? idx : DEFAULT_COL[key as keyof typeof DEFAULT_COL];
        }
        console.log("Colunas mapeadas:", JSON.stringify(COL));
        // Log sample row
        if (rows.length > 1) {
          const sample = rows[1] as unknown[];
          console.log("Primeira linha dados:", Object.entries(COL).map(([k, i]) => `${k}=${str(sample[i])}`).join(" | "));
        }

        const records: RouteRecord[] = [];
        const indexBR = new Map<string, RouteRecord[]>();
        const indexCluster = new Map<string, RouteRecord[]>();
        const indexBairro = new Map<string, RouteRecord[]>();

        // skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rec: RouteRecord = {
            AT: str(row[COL.AT]),
            Gaiola: str(row[COL.Gaiola]),
            BR: str(row[COL.BR]),
            TipoVeiculo: str(row[COL.TipoVeiculo]),
            Bairro: str(row[COL.Bairro]),
            Cidade: str(row[COL.Cidade]),
            SPR: str(row[COL.SPR]),
            Cluster: str(row[COL.Cluster]),
            Paradas: str(row[COL.Paradas]),
          };

          if (!rec.BR) continue;

          records.push(rec);

          // Index by BR
          if (!indexBR.has(rec.BR)) indexBR.set(rec.BR, []);
          indexBR.get(rec.BR)!.push(rec);

          // Index by Cluster
          if (rec.Cluster) {
            if (!indexCluster.has(rec.Cluster)) indexCluster.set(rec.Cluster, []);
            indexCluster.get(rec.Cluster)!.push(rec);
          }

          // Index by Bairro
          if (rec.Bairro) {
            if (!indexBairro.has(rec.Bairro)) indexBairro.set(rec.Bairro, []);
            indexBairro.get(rec.Bairro)!.push(rec);
          }
        }

        resolve({ records, indexBR, indexCluster, indexBairro });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

export type FilterMode = "cluster" | "bairro" | "ambos";

export function findSuggestions(
  record: RouteRecord,
  index: RouteIndex,
  filter: FilterMode
): RouteRecord[] {
  const seen = new Set<string>();
  seen.add(record.AT); // exclude original AT
  const results: RouteRecord[] = [];

  const addFromList = (list: RouteRecord[] | undefined) => {
    if (!list) return;
    for (const r of list) {
      if (!seen.has(r.AT)) {
        seen.add(r.AT);
        results.push(r);
      }
    }
  };

  if (filter === "cluster" || filter === "ambos") {
    addFromList(index.indexCluster.get(record.Cluster));
  }
  if (filter === "bairro" || filter === "ambos") {
    addFromList(index.indexBairro.get(record.Bairro));
  }

  // Sort: 1) Vehicle type: Van > Fiorino > Passeio > Moto, 2) Same Bairro first
  const vehiclePriority: Record<string, number> = {
    "van": 0,
    "fiorino": 1,
    "utilitário": 1,
    "utilitario": 1,
    "passeio": 2,
    "moto": 3,
  };

  const originalBairro = record.Bairro.toLowerCase();

  results.sort((a, b) => {
    // Primary: vehicle type priority
    const pa = vehiclePriority[a.TipoVeiculo.toLowerCase()] ?? 2;
    const pb = vehiclePriority[b.TipoVeiculo.toLowerCase()] ?? 2;
    if (pa !== pb) return pa - pb;

    // Secondary: same bairro as original comes first
    const bairroA = a.Bairro.toLowerCase() === originalBairro ? 0 : 1;
    const bairroB = b.Bairro.toLowerCase() === originalBairro ? 0 : 1;
    return bairroA - bairroB;
  });

  return results;
}

export function exportCSV(records: RouteRecord[]): void {
  const headers = ["AT", "Gaiola", "BR", "TipoVeiculo", "SPR", "Cidade", "Cluster", "Bairro", "Paradas"];
  const lines = [headers.join(",")];
  for (const r of records) {
    lines.push(headers.map((h) => `"${(r as unknown as Record<string, string>)[h] ?? ""}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sugestoes_rotas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export interface SwapLabel {
  BR: string;
  ATAntiga: string;
  GaiolaAntiga: string;
  ATNova: string;
  GaiolaNova: string;
  Cluster: string;
}
