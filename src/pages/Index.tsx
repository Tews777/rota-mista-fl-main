import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Download, ArrowRightLeft, AlertTriangle, Search, History, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FileUpload } from "@/components/FileUpload";
import { BRSearchBar } from "@/components/BRSearchBar";
import { BRResultCard } from "@/components/BRResultCard";
import { PrintLabels } from "@/components/PrintLabels";
import { SwapHistoryTable, type SwapHistoryEntry } from "@/components/SwapHistoryTable";
import {
  parseFile,
  findSuggestions,
  exportCSV,
  type RouteIndex,
  type RouteRecord,
  type FilterMode,
  type SwapLabel,
} from "@/lib/routeData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BRResult {
  br: string;
  records: RouteRecord[];
  suggestions: RouteRecord[];
}

type TabMode = "busca" | "historico";

const Index = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState<RouteIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [brInput, setBrInput] = useState("");
  const [filter, setFilter] = useState<FilterMode>("cluster");
  const [results, setResults] = useState<BRResult[]>([]);
  const [selectedSwaps, setSelectedSwaps] = useState<Map<string, { original: RouteRecord; swap: RouteRecord }>>(new Map());
  const [showLabels, setShowLabels] = useState(false);
  const [swapHistory, setSwapHistory] = useState<SwapHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabMode>("busca");
  const [ciclo, setCiclo] = useState<"AM" | "PM">("AM");

  // Load swap history from database and uploaded file from localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      // Load swap history from database
      const { data, error } = await supabase
        .from("swap_history")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) {
        setSwapHistory(
          data.map((row) => ({
            DATA: row.data,
            Ciclo: row.ciclo,
            RotaDE: row.rota_de,
            ModalDE: row.modal_de,
            RotaPARA: row.rota_para,
            ModalPARA: row.modal_para,
            QtdPacotes: row.qtd_pacotes,
            BR: row.br,
            ATOrigem: row.at_origem,
            ATDestino: row.at_destino,
            Bairro: row.bairro,
          }))
        );
      }

      // Load uploaded file from localStorage
      const savedIndex = localStorage.getItem("routeIndex");
      if (savedIndex) {
        try {
          setIndex(JSON.parse(savedIndex));
        } catch (e) {
          console.error("Failed to parse saved index:", e);
          localStorage.removeItem("routeIndex");
        }
      }
    };
    loadData();
  }, []);

  const handleClearCache = useCallback(() => {
    setIndex(null);
    setResults([]);
    setSelectedSwaps(new Map());
    setBrInput("");
  }, []);

  const handleClearAllData = useCallback(async () => {
    // Limpa arquivo em cache
    localStorage.removeItem("routeIndex");
    setIndex(null);
    setResults([]);
    setSelectedSwaps(new Map());
    setBrInput("");
    
    // Limpa histórico do Supabase
    const { error } = await supabase.from("swap_history").delete().gte("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Erro ao limpar histórico do banco.");
      console.error(error);
      return;
    }
    
    setSwapHistory([]);
    toast.success("Histórico e arquivo limpos com sucesso!");
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
      return;
    }
    navigate("/login");
  }, [navigate]);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const idx = await parseFile(file);
      setIndex(idx);
      // Save to localStorage so it persists on page reload
      localStorage.setItem("routeIndex", JSON.stringify(idx));
      setResults([]);
      setSelectedSwaps(new Map());
      toast.success(`${idx.records.length.toLocaleString()} registros carregados com sucesso!`);
    } catch {
      toast.error("Erro ao processar arquivo. Verifique o formato.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!index) return;
    const brs = brInput
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (brs.length === 0) {
      toast.warning("Digite pelo menos um BR.");
      return;
    }

    const res: BRResult[] = brs.map((br) => {
      const records = index.indexBR.get(br) ?? [];
      let suggestions: RouteRecord[] = [];
      if (records.length > 0) {
        suggestions = findSuggestions(records[0], index, filter);
      }
      return { br, records, suggestions };
    });

    // Replace all previous results with new search
    setResults(res);
    setSelectedSwaps(new Map());
  }, [index, brInput, filter]);

  const handleToggleSwap = useCallback((brKey: string, original: RouteRecord, at: string, rec: RouteRecord | null) => {
    setSelectedSwaps((prev) => {
      const next = new Map(prev);
      const key = `${brKey}__${at}`;
      if (rec) {
        next.set(key, { original, swap: rec });
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const handleConfirmSwaps = useCallback(async () => {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newEntries: SwapHistoryEntry[] = Array.from(selectedSwaps.values()).map(({ original, swap }) => ({
      DATA: dateStr,
      Ciclo: ciclo,
      RotaDE: original.Gaiola,
      ModalDE: original.TipoVeiculo,
      RotaPARA: swap.Gaiola,
      ModalPARA: swap.TipoVeiculo,
      QtdPacotes: "1",
      BR: original.BR,
      ATOrigem: original.AT,
      ATDestino: swap.AT,
      Bairro: swap.Bairro,
    }));

    // Save to database
    const dbRows = newEntries.map((e) => ({
      data: e.DATA,
      ciclo: e.Ciclo,
      rota_de: e.RotaDE,
      modal_de: e.ModalDE,
      rota_para: e.RotaPARA,
      modal_para: e.ModalPARA,
      qtd_pacotes: e.QtdPacotes,
      br: e.BR,
      at_origem: e.ATOrigem,
      at_destino: e.ATDestino,
      bairro: e.Bairro,
    }));

    const { error } = await supabase.from("swap_history").insert(dbRows);
    if (error) {
      toast.error("Erro ao salvar no banco de dados.");
      console.error(error);
      return;
    }

    // Remove confirmed BRs from results
    const confirmedBRs = new Set(newEntries.map((e) => e.BR));
    setResults((prev) => prev.filter((r) => !confirmedBRs.has(r.br)));

    setSwapHistory((prev) => [...prev, ...newEntries]);
    setSelectedSwaps(new Map());
    setBrInput("");

    // Show swap summary
    const summaryLines = newEntries.map(
      (e) => `BR ${e.BR}: ${e.RotaDE} → ${e.RotaPARA}`
    );
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">{newEntries.length} troca(s) registrada(s)!</p>
        {summaryLines.map((line, i) => (
          <p key={i} className="text-xs font-mono">{line}</p>
        ))}
      </div>,
      { duration: 6000 }
    );
  }, [selectedSwaps, ciclo]);

  const swapLabels: SwapLabel[] = Array.from(selectedSwaps.values()).map(({ original, swap }) => ({
    BR: original.BR,
    ATAntiga: original.AT,
    GaiolaAntiga: original.Gaiola,
    ATNova: swap.AT,
    GaiolaNova: swap.Gaiola,
    Cluster: swap.Cluster,
  }));

  const allSuggestions = results.flatMap((r) => r.suggestions);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">Rota Mista FL</h1>
              <p className="text-xs text-muted-foreground">Gestão de Trocas de Rotas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <FileUpload onFile={handleFile} loading={loading} hasData={!!index} recordCount={index?.records.length ?? 0} onClearCache={handleClearCache} onClearAllData={handleClearAllData} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      {index && (
        <div className="container pt-4">
          <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
            <button
              onClick={() => setActiveTab("busca")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "busca"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-4 w-4" />
              Busca
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "historico"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4" />
              Histórico
              {swapHistory.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {swapHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <main className="container py-6">
        {/* Tab: Busca */}
        {index && activeTab === "busca" && (
          <>
            {/* Ciclo selector + Search bar */}
            <div className="mb-6 animate-fade-in rounded-xl border bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground">Ciclo:</label>
                <div className="flex gap-1 rounded-lg border bg-muted p-1">
                  <button
                    onClick={() => setCiclo("AM")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      ciclo === "AM" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setCiclo("PM")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      ciclo === "PM" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
              <BRSearchBar
                brInput={brInput}
                onBRChange={setBrInput}
                filter={filter}
                onFilterChange={setFilter}
                onSearch={handleSearch}
                disabled={!index}
              />
            </div>

            {/* Action bar */}
            {results.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-3 animate-fade-in">
                <span className="text-sm text-muted-foreground">
                  {results.length} BR(s) consultados · {allSuggestions.length} sugestões totais
                </span>
                <div className="ml-auto flex gap-2">
                  {allSuggestions.length > 0 && (
                    <button
                      onClick={() => exportCSV(allSuggestions)}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </button>
                  )}
                  {selectedSwaps.size > 0 && (
                    <>
                      <button
                        onClick={handleConfirmSwaps}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Confirmar Trocas ({selectedSwaps.size})
                      </button>
                      <button
                        onClick={() => setShowLabels(true)}
                        className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        Etiquetas
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            <div className="space-y-4">
              {results.map((r) =>
                r.records.length === 0 ? (
                  <div key={r.br} className="animate-fade-in flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium">BR <span className="font-mono font-bold">{r.br}</span> não encontrado.</span>
                  </div>
                ) : (
                  <BRResultCard
                    key={r.br}
                    br={r.br}
                    records={r.records}
                    suggestions={r.suggestions}
                    originalRecord={r.records[0]}
                    selectedSwaps={new Map(
                      Array.from(selectedSwaps.entries())
                        .filter(([k]) => k.startsWith(`${r.br}__`))
                        .map(([k, v]) => [k.split("__")[1], v.swap])
                    )}
                    onToggleSwap={(at, rec) => handleToggleSwap(r.br, r.records[0], at, rec)}
                  />
                )
              )}
            </div>
          </>
        )}

        {/* Tab: Histórico */}
        {index && activeTab === "historico" && (
          <SwapHistoryTable
            entries={swapHistory}
            onClear={async () => {
              const { error } = await supabase.from("swap_history").delete().gte("id", "00000000-0000-0000-0000-000000000000");
              if (error) {
                toast.error("Erro ao limpar histórico do banco.");
                return;
              }
              setSwapHistory([]);
              toast.info("Histórico de trocas limpo.");
            }}
          />
        )}

        {/* Empty state */}
        {!index && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent">
              <Package className="h-10 w-10 text-accent-foreground" />
            </div>
            <h2 className="mb-2 font-display text-xl font-bold">Carregue sua planilha</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Faça upload de um arquivo Excel (.xlsx) ou CSV com os dados de rotas para começar a análise.
            </p>
          </div>
        )}
      </main>

      {showLabels && <PrintLabels labels={swapLabels} onClose={() => setShowLabels(false)} />}
    </div>
  );
};

export default Index;
