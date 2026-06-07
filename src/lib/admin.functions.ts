import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertIsAdmin(userId: string) {
  const admin = await getAdmin();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("FORBIDDEN: ليس لديك صلاحيات المسؤول");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdmin();
    const { data } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

/**
 * Promotes the current authenticated user to admin IF no admin exists yet.
 * Bootstrap-only: lets the very first signed-up user claim admin without
 * a manual SQL step. After that, only existing admins can grant roles.
 */
export const claimAdminIfNoneExists = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdmin();
    const { count, error: cErr } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) return { claimed: false };
    const { error } = await admin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { claimed: true };
  });

export const listAllVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { data, error } = await admin
      .from("videos")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateVideoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  storagePath: z.string().trim().min(1).max(500),
  thumbnailPath: z.string().trim().min(1).max(500).optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const createVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateVideoSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { data: row, error } = await admin
      .from("videos")
      .insert({
        title: data.title,
        description: data.description ?? null,
        video_url: `storage://videos/${data.storagePath}`,
        thumbnail_url: data.thumbnailPath ? `storage://thumbnails/${data.thumbnailPath}` : null,
        storage_path: data.storagePath,
        thumbnail_path: data.thumbnailPath ?? null,
        is_published: data.isPublished,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const UpdateVideoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const updateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateVideoSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const patch: {
      title?: string;
      description?: string | null;
      is_published?: boolean;
    } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.isPublished !== undefined) patch.is_published = data.isPublished;
    const { error } = await admin.from("videos").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { data: row } = await admin
      .from("videos")
      .select("storage_path, thumbnail_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      await admin.storage.from("videos").remove([row.storage_path]).catch(() => {});
    }
    if (row?.thumbnail_path) {
      await admin.storage.from("thumbnails").remove([row.thumbnail_path]).catch(() => {});
    }
    const { error } = await admin.from("videos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { data, error } = await admin
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { error } = await admin.from("registrations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getGoogleSheetId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "google_sheet_id")
      .maybeSingle();
    return { sheetId: data?.value ?? "" };
  });

export const setGoogleSheetId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ sheetId: z.string().trim().max(200) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertIsAdmin(context.userId);
    const admin = await getAdmin();
    const { error } = await admin
      .from("app_settings")
      .upsert({ key: "google_sheet_id", value: data.sheetId, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Returns a signed upload context. The browser uploads directly to Storage
 * with the user's bearer token (RLS allows admins).
 */
export const dummyPing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertIsAdmin(context.userId);
    return { ok: true };
  });