import { useState } from "react";
import { toast } from "sonner";
import { Loader2, FilePlus2, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAddenda,
  useAddAddendum,
  type DailyEvolution,
} from "@/features/dailyEvolutions/api";

export function AddendumSection({ evolution }: { evolution: DailyEvolution }) {
  const [text, setText] = useState("");
  const addAddendum = useAddAddendum(evolution.id);
  const addenda = getAddenda(evolution);

  async function handleAdd() {
    const value = text.trim();
    if (value.length < 5) {
      toast.error("Descreva a retificação (mínimo 5 caracteres).");
      return;
    }
    try {
      await addAddendum.mutateAsync(value);
      setText("");
      toast.success("Adendo registrado");
    } catch (e) {
      toast.error("Não foi possível registrar o adendo", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          Adendos / notas de retificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          O registro original não pode mais ser alterado. Para corrigir ou
          complementar, adicione um adendo — ele fica anexado à evolução sem
          modificá-la.
        </p>

        {addenda.length > 0 && (
          <ul className="space-y-3">
            {addenda.map((a, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Adendo {i + 1}
                  </span>
                  <span>
                    {a.author_name ?? "—"} ·{" "}
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{a.text}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Descreva a retificação ou complemento..."
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="brand"
              onClick={handleAdd}
              disabled={addAddendum.isPending}
            >
              {addAddendum.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FilePlus2 className="h-4 w-4" /> Adicionar adendo
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
