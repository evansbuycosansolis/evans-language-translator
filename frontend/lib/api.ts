const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export interface TranslationRequest {
  text: string;
  source_language: string;
  target_language: string;
  tone?: string;
}

export interface TranslationResponse {
  original_text: string;
  source_language: string;
  target_language: string;
  translation: string;
  ipa: string;
  simple_pronunciation: string;
  notes: string;
}

export async function translateText(
  payload: TranslationRequest
): Promise<TranslationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const errorBody = await res.json();
      message = errorBody?.detail ?? message;
    } catch {
      // ignore JSON parse failure — keep default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<TranslationResponse>;
}
