import { createSupabaseServerClient } from "@/lib/supabase";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();
  if (error || !authUser) return null;

  // Sync Prisma (crée si inexistant)
  let user = await db.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    user = await db.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email?.split("@")[0],
        image: authUser.user_metadata?.avatar_url,
      },
    });
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}