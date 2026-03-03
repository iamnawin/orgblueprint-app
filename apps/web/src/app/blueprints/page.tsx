"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Blueprint {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  isPublic: boolean;
  result: string;
}

export default function BlueprintsPage() {
  const router = useRouter();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/blueprints")
      .then((r) => {
        if (r.status === 401) { router.push("/auth/signin"); return null; }
        return r.json() as Promise<Blueprint[]>;
      })
      .then((data) => {
        if (data) setBlueprints(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  function toggleSelect(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 2) return [prev[1], slug]; // max 2
      return [...prev, slug];
    });
  }

  function compareSelected() {
    if (selected.length === 2) {
      router.push(`/compare?a=${selected[0]}&b=${selected[1]}`);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 text-slate-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading blueprints…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Blueprints</h1>
          {selected.length > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              {selected.length === 1 ? "Select one more to compare" : "2 blueprints selected"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {selected.length === 2 && (
            <Button onClick={compareSelected} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              🆚 Compare selected
            </Button>
          )}
          {selected.length > 0 && (
            <Button variant="outline" onClick={() => setSelected([])}>
              Clear
            </Button>
          )}
          <Link href="/">
            <Button>+ New blueprint</Button>
          </Link>
        </div>
      </div>

      {blueprints.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <p className="text-lg mb-4">No blueprints yet.</p>
            <Link href="/">
              <Button>Generate your first blueprint</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blueprints.length >= 2 && (
            <p className="text-xs text-slate-400 mb-1">
              💡 Tip: Check two blueprints to compare them side by side
            </p>
          )}
          {blueprints.map((bp) => {
            const result = JSON.parse(bp.result) as { confidenceScore: number };
            const isSelected = selected.includes(bp.slug);
            return (
              <Card
                key={bp.id}
                className={`hover:shadow-md transition-all ${isSelected ? "ring-2 ring-indigo-500 border-indigo-300" : "border-slate-200"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Compare checkbox */}
                      <button
                        onClick={() => toggleSelect(bp.slug)}
                        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-slate-300 hover:border-indigo-400"
                        }`}
                        title="Select to compare"
                      >
                        {isSelected && <span className="text-white text-xs font-bold leading-none">✓</span>}
                      </button>
                      <CardTitle className="text-base font-medium text-slate-800 leading-snug">
                        {bp.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bp.isPublic && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Public</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {result.confidenceScore}/100
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {new Date(bp.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/blueprint/${bp.slug}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      <Link href={`/blueprint/${bp.slug}/share`} target="_blank">
                        <Button size="sm" variant="ghost">Share</Button>
                      </Link>
                      <Link href={`/blueprint/${bp.slug}/print`} target="_blank">
                        <Button size="sm" variant="ghost">PDF</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
