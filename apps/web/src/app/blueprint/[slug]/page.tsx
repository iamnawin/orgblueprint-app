import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { BlueprintDashboard } from "@/components/BlueprintDashboard";
import { BlueprintResult } from "@orgblueprint/core";

interface Props {
  params: { slug: string };
}

export default async function BlueprintPage({ params }: Props) {
  const blueprint = await prisma.blueprint.findUnique({
    where: { slug: params.slug },
  });

  if (!blueprint) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === blueprint.userId;

  if (!blueprint.isPublic && !isOwner) redirect("/auth/signin");

  const result = JSON.parse(blueprint.result) as BlueprintResult;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <BlueprintDashboard
        result={result}
        slug={blueprint.slug}
        isOwner={isOwner}
      />
    </div>
  );
}
