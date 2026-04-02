import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  let session: { user?: { email?: string | null } } | null = null;

  try {
    const { auth } = await import("@/auth");
    session = await auth();
  } catch (error) {
    console.error("Navbar auth unavailable", error);
  }

  return (
    <nav className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-2.5 shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-blue-400 tracking-tight">
          OrgBlueprint
        </Link>
        {session && (
          <Link href="/blueprints" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            My Blueprints
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            <span className="text-sm text-slate-500">{session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/auth");
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-200">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
