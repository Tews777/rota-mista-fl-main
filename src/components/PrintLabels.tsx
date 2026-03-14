import type { SwapLabel } from "@/lib/routeData";

interface PrintLabelsProps {
  labels: SwapLabel[];
  onClose: () => void;
}

export function PrintLabels({ labels, onClose }: PrintLabelsProps) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 no-print">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between no-print">
          <h2 className="font-display text-lg font-bold">Etiquetas de Troca</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Imprimir
            </button>
            <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">
              Fechar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3" id="print-area">
          {labels.map((l, i) => (
            <div key={i} className="print-label rounded-lg border-2 border-dashed border-primary/30 p-4">
              <div className="mb-2 text-center font-display text-sm font-bold text-primary">TROCA DE AT</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="font-semibold">BR:</span><span className="font-mono">{l.BR}</span></div>
                <div className="flex justify-between"><span className="font-semibold">AT Antiga:</span><span className="font-mono">{l.ATAntiga}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Gaiola Antiga:</span><span>{l.GaiolaAntiga}</span></div>
                <hr className="my-1 border-dashed" />
                <div className="flex justify-between"><span className="font-semibold">AT Nova:</span><span className="font-mono font-bold text-primary">{l.ATNova}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Gaiola Nova:</span><span className="font-bold">{l.GaiolaNova}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Cluster:</span><span>{l.Cluster}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
