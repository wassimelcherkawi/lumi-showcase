/**
 * Append a registration row to the configured Google Sheet via the
 * Lovable connector gateway. Returns true on success, false if no sheet
 * is configured, throws on actual API errors.
 */
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

export type RegistrationRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  videoTitle: string;
  date: string;
};

async function getSpreadsheetId(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "google_sheet_id")
    .maybeSingle();
  if (error) return null;
  const id = data?.value?.trim();
  return id && id.length > 0 ? id : null;
}

export async function appendRegistrationToSheet(row: RegistrationRow): Promise<boolean> {
  const spreadsheetId = await getSpreadsheetId();
  if (!spreadsheetId) return false;

  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey || !sheetsKey) {
    console.error("Missing LOVABLE_API_KEY or GOOGLE_SHEETS_API_KEY for Sheets sync");
    return false;
  }

  const range = "Sheet1!A1";
  const url = `${GATEWAY}/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const body = {
    values: [
      [row.firstName, row.lastName, row.email, row.phone, row.videoTitle, row.date],
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Sheets append failed (${res.status}): ${text}`);
  }
  return true;
}