import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendRegistrationToSheet } from "./sheets.server";

const SUPABASE_URL = () => process.env.SUPABASE_URL!;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function signUrl(path: string | null, bucket: string, expires = 60 * 60 * 24 * 7) {
  if (!path) return null;
  const admin = await getAdmin();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expires);
  if (error || !data) return null;
  return data.signedUrl;
}

export type PublicVideo = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
};

export const listPublishedVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicVideo[]> => {
    const admin = await getAdmin();
    const { data, error } = await admin
      .from("videos")
      .select("id, title, description, video_url, thumbnail_url, storage_path, thumbnail_path, position, created_at")
      .eq("is_published", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const out: PublicVideo[] = [];
    for (const v of data ?? []) {
      let videoUrl = v.video_url;
      let thumbUrl = v.thumbnail_url;
      if (v.storage_path) {
        const signed = await signUrl(v.storage_path, "videos");
        if (signed) videoUrl = signed;
      }
      if (v.thumbnail_path) {
        const signed = await signUrl(v.thumbnail_path, "thumbnails");
        if (signed) thumbUrl = signed;
      }
      out.push({
        id: v.id,
        title: v.title,
        description: v.description,
        video_url: videoUrl,
        thumbnail_url: thumbUrl,
      });
    }
    return out;
  },
);

const RegistrationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .trim()
    .min(5)
    .max(30)
    .regex(/^[+\d\s()-]+$/),
  videoId: z.string().uuid(),
});

export const createRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RegistrationSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: video, error: vErr } = await admin
      .from("videos")
      .select("id, title")
      .eq("id", data.videoId)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!video) throw new Error("الفيديو غير موجود");

    const { data: inserted, error } = await admin
      .from("registrations")
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        video_id: video.id,
        video_title: video.title,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Try sync to Google Sheets (non-fatal)
    try {
      const synced = await appendRegistrationToSheet({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        videoTitle: video.title,
        date: new Date().toISOString(),
      });
      if (synced) {
        await admin
          .from("registrations")
          .update({ synced_to_sheets: true })
          .eq("id", inserted.id);
      }
    } catch (e) {
      console.error("Google Sheets sync failed", e);
    }

    return { ok: true };
  });

// Keep URL warning down
export const _ = SUPABASE_URL;