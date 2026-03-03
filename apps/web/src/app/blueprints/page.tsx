import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function BlueprintsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const blueprints = await prisma.blueprint.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Blueprints</h1>
        <Link href="/">
          <Button>+ New blueprint</Button>
        </Link>
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
        <div className="space-y-4">
          {blueprints.map((bp) => {
            const result = JSON.parse(bp.result) as { confidenceScore: number };
            return (
              <Card key={bp.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base font-medium text-slate-800 leading-snug">
                      {bp.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bp.isPublic && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                          Public
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {result.confidenceScore}/100 confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      {new Date(bp.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/blueprint/${bp.slug}`}>
                        <Button size="sm" variant="outline">View</Button>
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
