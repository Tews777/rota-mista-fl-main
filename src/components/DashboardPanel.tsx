import { useState, useMemo } from "react";
import { TrendingUp, BarChart3, Calendar, User, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SwapHistoryEntry } from "@/components/SwapHistoryTable";

interface DashboardPanelProps {
  entries: SwapHistoryEntry[];
  currentUsername: string;
  onUndoSwap: (entry: SwapHistoryEntry) => Promise<void>;
}

export function DashboardPanel({ entries, currentUsername, onUndoSwap }: DashboardPanelProps) {
  const [selectedDateRange, setSelectedDateRange] = useState<"today" | "week" | "month" | "all">("today");
  const [filterByUser, setFilterByUser] = useState<"all" | string>("all");
  const [undoLoading, setUndoLoading] = useState<number | null>(null);

  // Extract unique users
  const users = useMemo(() => {
    const uniqueUsers = new Set<string>();
    entries.forEach((e) => {
      if (e.usuario) uniqueUsers.add(e.usuario);
    });
    return Array.from(uniqueUsers).sort();
  }, [entries]);

  // Filter entries by date range
  const filteredByDate = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return entries.filter((e) => {
      const [datePart] = e.DATA.split(" ");
      const [day, month, year] = datePart.split("/").map(Number);
      const entryDate = new Date(year, month - 1, day);

      switch (selectedDateRange) {
        case "today":
          return entryDate.getTime() === today.getTime();
        case "week": {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return entryDate >= weekAgo && entryDate <= today;
        }
        case "month": {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return entryDate >= monthAgo && entryDate <= today;
        }
        case "all":
          return true;
      }
    });
  }, [entries, selectedDateRange]);

  // Filter by user
  const filteredEntries = useMemo(() => {
    if (filterByUser === "all") return filteredByDate;
    return filteredByDate.filter((e) => e.usuario === filterByUser);
  }, [filteredByDate, filterByUser]);

  // Statistics
  const stats = useMemo(() => {
    const totalSwaps = filteredEntries.length;
    const uniqueBRs = new Set(filteredEntries.map((e) => e.BR)).size;
    const uniqueRoutes = new Set(
      filteredEntries.flatMap((e) => [e.RotaDE, e.RotaPARA])
    ).size;

    return { totalSwaps, uniqueBRs, uniqueRoutes };
  }, [filteredEntries]);

  // Most swapped routes
  const topRoutes = useMemo(() => {
    const routeCounts: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      routeCounts[e.RotaDE] = (routeCounts[e.RotaDE] || 0) + 1;
    });
    return Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filteredEntries]);

  // Most swapped neighborhoods
  const topNeighborhoods = useMemo(() => {
    const neighborhoodCounts: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      neighborhoodCounts[e.Bairro] = (neighborhoodCounts[e.Bairro] || 0) + 1;
    });
    return Object.entries(neighborhoodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filteredEntries]);

  // Swaps by user
  const swapsByUser = useMemo(() => {
    const userCounts: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      if (e.usuario) {
        userCounts[e.usuario] = (userCounts[e.usuario] || 0) + 1;
      }
    });
    return Object.entries(userCounts).sort(([, a], [, b]) => b - a);
  }, [filteredEntries]);

  // Swaps by cycle
  const swapsByCycle = useMemo(() => {
    const cycleCounts: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      cycleCounts[e.Ciclo] = (cycleCounts[e.Ciclo] || 0) + 1;
    });
    return Object.entries(cycleCounts).sort(([, a], [, b]) => b - a);
  }, [filteredEntries]);

  const handleUndoSwap = async (entry: SwapHistoryEntry, index: number) => {
    setUndoLoading(index);
    try {
      await onUndoSwap(entry);
    } finally {
      setUndoLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="animate-fade-in rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedDateRange}
              onChange={(e) =>
                setSelectedDateRange(e.target.value as "today" | "week" | "month" | "all")
              }
              className="rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="today">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
              <option value="all">Todos os períodos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterByUser}
              onChange={(e) => setFilterByUser(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos os usuários</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-in rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total de Trocas</p>
              <p className="text-2xl font-bold">{stats.totalSwaps}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="animate-fade-in rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">BRs Únicos</p>
              <p className="text-2xl font-bold">{stats.uniqueBRs}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue/10">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="animate-fade-in rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Rotas Movimentadas</p>
              <p className="text-2xl font-bold">{stats.uniqueRoutes}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Routes */}
        <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-display text-sm font-bold">Rotas Mais Trocadas</h3>
          </div>
          <div className="p-4">
            {topRoutes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-2">
                {topRoutes.map(([route, count]) => (
                  <div key={route} className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{route}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Neighborhoods */}
        <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-display text-sm font-bold">Bairros Mais Movimentados</h3>
          </div>
          <div className="p-4">
            {topNeighborhoods.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-2">
                {topNeighborhoods.map(([neighborhood, count]) => (
                  <div key={neighborhood} className="flex items-center justify-between">
                    <span className="text-sm">{neighborhood}</span>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swaps by User */}
        <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-display text-sm font-bold">Trocas por Usuário</h3>
          </div>
          <div className="p-4">
            {swapsByUser.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-2">
                {swapsByUser.map(([user, count]) => (
                  <div key={user} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{user}</span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swaps by Cycle */}
        <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-display text-sm font-bold">Trocas por Ciclo</h3>
          </div>
          <div className="p-4">
            {swapsByCycle.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-2">
                {swapsByCycle.map(([cycle, count]) => (
                  <div key={cycle} className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{cycle}</span>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Swaps with Undo */}
      {filteredEntries.length > 0 && (
        <div className="animate-fade-in rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="font-display text-sm font-bold">Trocas Recentes (com opção de desfazer)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2 font-medium">DATA</th>
                  <th className="p-2 font-medium">BR</th>
                  <th className="p-2 font-medium">ROTA</th>
                  <th className="p-2 font-medium">AT ORIGEM</th>
                  <th className="p-2 font-medium">AT DESTINO</th>
                  <th className="p-2 font-medium">USUÁRIO</th>
                  <th className="p-2 font-medium">AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(0, 10).map((e, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="p-2 text-xs">{e.DATA}</td>
                    <td className="p-2 font-mono font-semibold">{e.BR}</td>
                    <td className="p-2">
                      <span className="text-xs">
                        {e.RotaDE} → {e.RotaPARA}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-xs">{e.ATOrigem}</td>
                    <td className="p-2 font-mono text-xs">{e.ATDestino}</td>
                    <td className="p-2 text-xs">{e.usuario || "—"}</td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUndoSwap(e, i)}
                        disabled={undoLoading === i}
                        className="h-6 w-6 p-0"
                      >
                        {undoLoading === i ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredEntries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-12 text-center">
          <BarChart3 className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma troca encontrada para este período</p>
        </div>
      )}
    </div>
  );
}
