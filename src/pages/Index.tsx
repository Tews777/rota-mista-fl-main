import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Download, ArrowRightLeft, AlertTriangle, Search, History, LogOut, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderFileUpload } from "@/components/HeaderFileUpload";
import { FileUpload } from "@/components/FileUpload";
import { BRSearchBar } from "@/components/BRSearchBar";
import { BRResultCard } from "@/components/BRResultCard";
import { PrintLabels } from "@/components/PrintLabels";
import { SwapHistoryTable, type SwapHistoryEntry } from "@/components/SwapHistoryTable";
import { DashboardPanel } from "@/components/DashboardPanel";
import {
  parseFile,
  findSuggestions,
  exportCSV,
  serializeRouteIndex,
  deserializeRouteIndex,
  normalizeVehicleType,
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

type TabMode = "busca" | "historico" | "dashboard";

const Index = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState<RouteIndex | null>(null);
  const [totalBRsInFile, setTotalBRsInFile] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [brInput, setBrInput] = useState("");
  const [filter, setFilter] = useState<FilterMode>("cluster");
  const [results, setResults] = useState<BRResult[]>([]);
  const [selectedSwaps, setSelectedSwaps] = useState<Map<string, { original: RouteRecord; swap: RouteRecord }>>(new Map());
  const [showLabels, setShowLabels] = useState(false);
  const [swapHistory, setSwapHistory] = useState<SwapHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabMode>("busca");
  const [ciclo, setCiclo] = useState<"AM" | "PM">("AM");
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const usernameRef = useRef<string>("");

  // Load swap history from database and uploaded file from localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      // Get username from session
      const session = localStorage.getItem("auth_session");
      const username = session ? JSON.parse(session).username : "guest";
      
      // Store in ref imediatamente para ser usado em getStorageKey
      usernameRef.current = username;
      setCurrentUsername(username);

      // Load swap history from database
      const { data, error } = await supabase
        .from("swap_history")
        .select("data,ciclo,rota_de,modal_de,rota_para,modal_para,qtd_pacotes,br,at_origem,at_destino,bairro")
        .order("created_at", { ascending: true });
      if (!error && data) {
        setSwapHistory(
          data.map((row: any) => ({
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
      } else if (error) {
        console.error("Erro ao carregar histórico:", error);
      }

      // Load uploaded file from localStorage usando chave do username
      const storageKey = `${username}_routeIndex`;
      const savedIndex = localStorage.getItem(storageKey);
      
      console.log("🔍 Tentando carregar arquivo:", { username, storageKey, temDados: !!savedIndex });
      
      if (savedIndex) {
        try {
          const deserialized = deserializeRouteIndex(savedIndex);
          
          // Validar que tem indexBR como Map
          if (
            deserialized &&
            deserialized.indexBR &&
            deserialized.indexBR instanceof Map &&
            deserialized.indexBR.size > 0 &&
            deserialized.records &&
            Array.isArray(deserialized.records)
          ) {
            console.log("✅ Arquivo carregado com sucesso:", { brsUnicos: deserialized.indexBR.size });
            setIndex(deserialized);
            // Calcular total de BRs únicos no arquivo
            setTotalBRsInFile(deserialized.indexBR.size);
          } else {
            console.warn("❌ Index inválido. Removendo do localStorage.");
            localStorage.removeItem(storageKey);
            setIndex(null);
            setTotalBRsInFile(0);
          }
        } catch (e) {
          console.error("❌ Erro ao desserializar index:", e);
          localStorage.removeItem(storageKey);
          setIndex(null);
          setTotalBRsInFile(0);
        }
      } else {
        console.log("ℹ️ Nenhum arquivo salvo no localStorage");
        setIndex(null);
        setTotalBRsInFile(0);
      }
    };
    loadData();
  }, []);

  const handleClearCache = useCallback(() => {
    const storageKey = getStorageKey("routeIndex");
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${usernameRef.current || currentUsername || "guest"}_routeIndex`);
    setIndex(null);
    setResults([]);
    setSelectedSwaps(new Map());
    setBrInput("");
    setTotalBRsInFile(0);
  }, [currentUsername]);

  const handleClearAllData = useCallback(async () => {
    // Limpa arquivo em cache (per-user)
    localStorage.removeItem(getStorageKey("routeIndex"));
    setIndex(null);
    setResults([]);
    setSelectedSwaps(new Map());
    setBrInput("");
    
    // Limpa histórico do Supabase
    try {
      const { error } = await supabase.from("swap_history").delete().gte("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        toast.error("Erro ao limpar histórico do banco.");
        console.error("Clear all error:", error);
        return;
      }
    } catch (err) {
      toast.error("Erro ao limpar histórico do banco.");
      console.error("Clear all exception:", err);
      return;
    }
    
    setSwapHistory([]);
    toast.success("Histórico e arquivo limpos com sucesso!");
  }, []);

  const handleLogout = useCallback(async () => {
    // Limpar sessão do localStorage
    localStorage.removeItem("auth_session");
    navigate("/login");
    toast.success("Logout realizado com sucesso!");
  }, [navigate]);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const idx = await parseFile(file);
      
      setIndex(idx);
      
      // Calcular total de BRs únicos no arquivo
      const totalUniqueBRs = idx.indexBR.size;
      setTotalBRsInFile(totalUniqueBRs);
      
      // Save to localStorage using proper serialization (per-user)
      const serialized = serializeRouteIndex(idx);
      const storageKey = `${usernameRef.current || currentUsername || "guest"}_routeIndex`;
      
      console.log("💾 Salvando arquivo:", { storageKey, tamanho: serialized.length, registros: idx.records.length });
      
      // Check localStorage quota before saving
      try {
        localStorage.setItem(storageKey, serialized);
        console.log("✅ Arquivo salvo com sucesso no localStorage");
      } catch (storageError: any) {
        if (storageError.name === 'QuotaExceededError') {
          toast.error("Arquivo muito grande para salvar em cache. Usando modo temporário.");
          console.warn("localStorage quota exceeded, using memory cache only");
        } else {
          console.error("Erro ao salvar:", storageError);
          throw storageError;
        }
      }
      
      setResults([]);
      setSelectedSwaps(new Map());
      toast.success(`${idx.records.length.toLocaleString()} registros carregados com sucesso!`);
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      toast.error("Erro ao processar arquivo. Verifique o formato.");
    } finally {
      setLoading(false);
    }
  }, [currentUsername]);

  const handleSearch = useCallback(() => {
    if (!index || !index.indexBR || !(index.indexBR instanceof Map)) {
      toast.error("Nenhum arquivo carregado ou arquivo inválido. Carregue um arquivo primeiro.");
      return;
    }

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
      ModalDE: normalizeVehicleType(original.TipoVeiculo),
      RotaPARA: swap.Gaiola,
      ModalPARA: normalizeVehicleType(swap.TipoVeiculo),
      QtdPacotes: "1",
      BR: original.BR,
      ATOrigem: original.AT,
      ATDestino: swap.AT,
      Bairro: swap.Bairro,
    }));

    // Save to database (only the columns that exist in swap_history table)
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
      console.error("Erro detalhado:", error);
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
  }, [selectedSwaps, ciclo, currentUsername]);

  const swapLabels: SwapLabel[] = Array.from(selectedSwaps.values()).map(({ original, swap }) => ({
    BR: original.BR,
    ATAntiga: original.AT,
    GaiolaAntiga: original.Gaiola,
    ATNova: swap.AT,
    GaiolaNova: swap.Gaiola,
    Cluster: swap.Cluster,
  }));

  const handleUndoSwap = useCallback(async (entry: SwapHistoryEntry) => {
    try {
      const { error } = await supabase
        .from("swap_history")
        .delete()
        .match({
          br: entry.BR,
          at_origem: entry.ATOrigem,
          at_destino: entry.ATDestino,
          data: entry.DATA,
        });

      if (error) {
        toast.error("Erro ao desfazer troca.");
        console.error("Undo error:", error);
        return;
      }

      setSwapHistory((prev) => 
        prev.filter((e) => !(e.BR === entry.BR && e.ATOrigem === entry.ATOrigem && e.ATDestino === entry.ATDestino && e.DATA === entry.DATA))
      );
      toast.success(`Troca de BR ${entry.BR} desfeita com sucesso!`);
    } catch (err) {
      toast.error("Erro ao desfazer troca.");
      console.error("Undo exception:", err);
    }
  }, []);

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
            {currentUsername && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-primary">{currentUsername}</span>
              </div>
            )}
            {index && <HeaderFileUpload onFile={handleFile} loading={loading} />}
            <ThemeToggle />
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
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "dashboard"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
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

      <main className="container py-6">
        {/* Tab: Busca */}
        {activeTab === "busca" && (
          <>
            {/* File Upload - Show when no index loaded */}
            {!index && (
              <div className="mb-6 animate-fade-in">
                <FileUpload 
                  onFile={handleFile}
                  loading={loading}
                  hasData={!!index}
                  recordCount={index?.records.length || 0}
                  onClearCache={handleClearCache}
                  onClearAllData={handleClearAllData}
                />
              </div>
            )}

            {/* Ciclo selector + Search bar - Show only when index loaded */}
            {index && (
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
            )}

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

              {/* Sticky action bar at the bottom of results */}
              {selectedSwaps.size > 0 && (
                <div className="sticky bottom-0 animate-fade-in rounded-xl border bg-card/95 backdrop-blur p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 mt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    <span className="text-primary font-semibold">{selectedSwaps.size} troca(s)</span> selecionada(s)
                  </div>
                  <div className="flex gap-2 ml-auto">
                    {allSuggestions.length > 0 && (
                      <button
                        onClick={() => exportCSV(allSuggestions)}
                        className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <Download className="h-4 w-4" />
                        Exportar CSV
                      </button>
                    )}
                    <button
                      onClick={() => setShowLabels(true)}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      Etiquetas
                    </button>
                    <button
                      onClick={handleConfirmSwaps}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Confirmar Trocas ({selectedSwaps.size})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab: Histórico */}
        {activeTab === "historico" && (
          <>
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
            {swapHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma troca registrada ainda.</p>
              </div>
            )}
          </>
        )}

        {/* Tab: Dashboard */}
        {activeTab === "dashboard" && (
          <>
            <DashboardPanel 
              entries={swapHistory} 
              currentUsername={currentUsername}
              onUndoSwap={handleUndoSwap}
              totalBRsInFile={totalBRsInFile}
            />
            {swapHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma troca registrada para análise.</p>
              </div>
            )}
          </>
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
