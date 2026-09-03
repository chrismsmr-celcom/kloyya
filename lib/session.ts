import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser || !authUser.email) {
    return null;
  }

  // Synchronise l'utilisateur Supabase avec Prisma.
  // L'ID Supabase devient l'ID Prisma.
  let user = await db.user.findUnique({
    where: {
      id: authUser.id,
    },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name:
          authUser.user_metadata?.name ??
          authUser.user_metadata?.full_name ??
          authUser.email.split("@")[0],
        image:
          authUser.user_metadata?.avatar_url ??
          authUser.user_metadata?.picture ??
          null,
      },
    });
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return user;
}
