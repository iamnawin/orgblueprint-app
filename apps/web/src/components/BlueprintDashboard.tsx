"use client";

import { useState } from "react";
import { BlueprintResult } from "@orgblueprint/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  result: BlueprintResult;
  slug: string | null;
  isOwner: boolean;
  aiPowered?: boolean;
  onReset?: () => void;
}

const levelColors: Record<string, string> = {
  recommended: "bg-green-100 text-green-800 border-green-200",
  optional: "bg-yellow-100 text-yellow-800 border-yellow-200",
  not_needed: "bg-slate-100 text-slate-500 border-slate-200",
};

function EditableList({
  items,
  onSave,
}: {
  items: string[];
  onSave: (updated: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(items.join("\n"));

  function save() {
    onSave(text.split("\n").filter(Boolean));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          className="text-sm min-h-32"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-700 mt-1 print:hidden" onClick={() => setEditing(true)}>
        ✏ Edit
      </Button>
    </div>
  );
}

export function BlueprintDashboard({ result: initial, slug, isOwner, aiPowered = false, onReset }: Props) {
  const [result, setResult] = useState<BlueprintResult>(initial);
  const [saving, setSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  function updateSection<K extends keyof BlueprintResult>(key: K, value: BlueprintResult[K]) {
    setResult((prev) => ({ ...prev, [key]: value }));
  }

  async function persistResult(updated: BlueprintResult) {
    if (!slug || !isOwner) return;
    setSaving(true);
    try {
      await fetch(`/api/blueprint/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: updated }),
      });
    } finally {
      setSaving(false);
    }
  }

  function editList(key: keyof BlueprintResult) {
    return (updated: string[]) => {
      const next = { ...result, [key]: updated };
      setResult(next);
      persistResult(next);
    };
  }

  async function shareBlueprint() {
    if (!slug) return;
    await fetch(`/api/blueprint/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: true }),
    });
    setIsPublic(true);
    const url = `${window.location.origin}/blueprint/${slug}`;
    await navigator.clipboard.writeText(url);
    setShareMsg("Link copied to clipboard!");
    setTimeout(() => setShareMsg(null), 3000);
  }

  function exportPDF() {
    if (slug) {
      window.open(`/blueprint/${slug}/print`, "_blank");
    } else {
      window.print();
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Salesforce Blueprint</h1>
          {aiPowered && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">AI-powered</Badge>
          )}
          <Badge className="bg-slate-100 text-slate-600 border-slate-200">
            Confidence: {result.confidenceScore}/100
          </Badge>
        </div>
        <div className="flex gap-2 items-center">
          {saving && <span className="text-xs text-slate-400">Saving…</span>}
          {shareMsg && <span className="text-xs text-green-600">{shareMsg}</span>}
          {slug && isOwner && !isPublic && (
            <Button variant="outline" size="sm" onClick={shareBlueprint}>
              Share link
            </Button>
          )}
          {isPublic && (
            <Badge className="bg-green-100 text-green-700 border-green-200">Public</Badge>
          )}
          <Button variant="outline" size="sm" onClick={exportPDF}>
            Export PDF
          </Button>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              ← New blueprint
            </Button>
          )}
        </div>
      </div>

      {/* Executive snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Executive Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableList items={result.executiveSnapshot} onSave={editList("executiveSnapshot")} />
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Product Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {(["recommended", "optional", "not_needed"] as const).map((level) => (
              <div key={level}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  {level.replace("_", " ")}
                </p>
                <div className="space-y-2">
                  {result.products
                    .filter((p) => p.level === level)
                    .map((p) => (
                      <div
                        key={p.key}
                        className={`rounded-lg border px-3 py-2 text-sm ${levelColors[level]}`}
                      >
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs mt-0.5 opacity-80">{p.reasons[0]}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed sections */}
      <Tabs defaultValue="ootb">
        <TabsList className="flex-wrap h-auto print:hidden">
          <TabsTrigger value="ootb">OOTB vs Custom</TabsTrigger>
          <TabsTrigger value="objects">Objects & Automations</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="cost">Cost Estimate</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="docs">Document Checklist</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
        </TabsList>

        <TabsContent value="ootb">
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="pb-2 pr-4 font-medium">Capability</th>
                      <th className="pb-2 pr-4 font-medium">Approach</th>
                      <th className="pb-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.ootbVsCustom.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-medium text-slate-800">{row.capability}</td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant="outline"
                            className={
                              row.approach === "OOTB"
                                ? "border-green-300 text-green-700"
                                : row.approach === "Config"
                                ? "border-blue-300 text-blue-700"
                                : "border-orange-300 text-orange-700"
                            }
                          >
                            {row.approach}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-600">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objects">
          <Card>
            <CardContent className="pt-4">
              <EditableList items={result.objectsAndAutomations} onSave={editList("objectsAndAutomations")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardContent className="pt-4">
              <EditableList items={result.integrationMap} onSave={editList("integrationMap")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="pt-4">
              <EditableList items={result.analyticsPack} onSave={editList("analyticsPack")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-2xl font-bold text-slate-800">{result.costSimulator.range}</p>
                <p className="text-sm text-slate-500">Directional year-1 estimate</p>
              </div>
              <EditableList items={result.costSimulator.assumptions} onSave={(updated) => {
                const next = { ...result, costSimulator: { ...result.costSimulator, assumptions: updated } };
                setResult(next);
                persistResult(next);
              }} />
              <div className="rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                {result.costSimulator.disclaimer}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {result.roadmap.map((phase, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{phase.phase}</p>
                    <ul className="list-disc pl-4 text-sm text-slate-600 mt-1 space-y-0.5">
                      {phase.outcomes.map((o, j) => <li key={j}>{o}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardContent className="pt-4">
              <EditableList items={result.documentChecklist} onSave={editList("documentChecklist")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card>
            <CardContent className="pt-4">
              <EditableList items={result.risks} onSave={editList("risks")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
