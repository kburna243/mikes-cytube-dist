import { adminEnabled, isAdmin } from "@/lib/adminAuth";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminEnabled()) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <h1 className="type-condensed text-6xl">Admin</h1>
        <p className="mt-4 text-fg-muted">Noch nicht eingerichtet: auf dem Server fehlt ADMIN_PASSWORD (mindestens 8 Zeichen).</p>
      </main>
    );
  }
  return <AdminApp authed={await isAdmin()} />;
}
