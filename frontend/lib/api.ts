const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8010";

export const TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
] as const;

export type TtsVoice = (typeof TTS_VOICES)[number];

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

export interface TranslationDisplayResult {
  source_language: string;
  target_language: string;
  translation: string;
  ipa: string;
  simple_pronunciation: string;
  notes: string;
  transcript?: string;
}

export interface TextToSpeechRequest {
  text: string;
  language: string;
  voice: TtsVoice;
}

export interface TranscriptionResponse {
  transcript: string;
  source_language: string | null;
}

export interface SpeechTranslationResponse extends TranslationDisplayResult {
  transcript: string;
  audio_url: string | null;
}

export interface AudioUploadPayload {
  audio: Blob;
  filename?: string;
  source_language?: string;
  profile_context?: string;
}

export interface SpeechTranslatePayload {
  audio: Blob;
  filename?: string;
  source_language: string;
  target_language: string;
  tone?: string;
  generate_voiceover?: boolean;
  voice?: TtsVoice;
  profile_context?: string;
}

function buildNetworkErrorMessage(action: string): string {
  return (
    `Could not ${action} because the frontend could not reach the backend at ` +
    `${API_BASE_URL}. Make sure the FastAPI server is running and try ` +
    `${API_BASE_URL}/health in your browser.`
  );
}

async function parseErrorResponse(res: Response): Promise<string> {
  let message = `Request failed with status ${res.status}`;

  try {
    const errorBody = await res.json();
    message = errorBody?.detail ?? message;
  } catch {
    try {
      const textBody = (await res.text()).trim();
      if (textBody) {
        message = textBody.length > 300 ? `${textBody.slice(0, 300)}...` : textBody;
      }
    } catch {
      // Ignore text parse failure and keep the default message.
    }
  }

  if (res.status === 503) {
    return `${message} Check that the backend server is running and that your OpenAI configuration is valid.`;
  }

  if (res.status >= 500) {
    return `${message} Check the backend terminal logs for the full stack trace if this keeps happening.`;
  }

  return message;
}

export async function translateText(
  payload: TranslationRequest
): Promise<TranslationResponse> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(buildNetworkErrorMessage("translate text"));
    }
    throw error;
  }

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  return res.json() as Promise<TranslationResponse>;
}

export async function generateSpeech(
  payload: TextToSpeechRequest
): Promise<Blob> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(buildNetworkErrorMessage("generate pronunciation audio"));
    }
    throw error;
  }

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  return res.blob();
}

async function postFormData<T>(
  endpoint: string,
  formData: FormData,
  action: string
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(buildNetworkErrorMessage(action));
    }
    throw error;
  }

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  return res.json() as Promise<T>;
}

export async function transcribeAudio(
  payload: AudioUploadPayload
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append(
    "file",
    payload.audio,
    payload.filename ?? "recording.webm"
  );

  if (payload.source_language) {
    formData.append("source_language", payload.source_language);
  }

  if (payload.profile_context) {
    formData.append("profile_context", payload.profile_context);
  }

  return postFormData<TranscriptionResponse>(
    "/api/transcribe",
    formData,
    "transcribe speech"
  );
}

export async function translateSpeech(
  payload: SpeechTranslatePayload
): Promise<SpeechTranslationResponse> {
  const formData = new FormData();
  formData.append(
    "file",
    payload.audio,
    payload.filename ?? "recording.webm"
  );
  formData.append("source_language", payload.source_language);
  formData.append("target_language", payload.target_language);
  formData.append("tone", payload.tone ?? "neutral");
  formData.append(
    "generate_voiceover",
    payload.generate_voiceover ? "true" : "false"
  );
  formData.append("voice", payload.voice ?? "coral");

  if (payload.profile_context) {
    formData.append("profile_context", payload.profile_context);
  }

  return postFormData<SpeechTranslationResponse>(
    "/api/speech-translate",
    formData,
    "translate recorded speech"
  );
}
