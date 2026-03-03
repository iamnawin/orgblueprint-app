import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-slate-800 bg-slate-900 px-6 py-3 flex items-center justify-between shadow-sm">
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
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
