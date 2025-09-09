import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PostLoginRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const role = session.user?.role?.toLowerCase();

  if (role === "admin") {
    redirect("/dashboard/admin");
  }

  // All other authenticated users (e.g., 'user') go to the user dashboard.
  redirect("/dashboard/user");
}
