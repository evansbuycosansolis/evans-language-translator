"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleAlert,
  Loader2,
  Mic,
  Radio,
  RefreshCw,
  Square,
  Trash2,
  Waves,
} from "lucide-react";

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
  message?: string;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: (audioTrack?: MediaStreamTrack) => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type MicrophonePermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

interface AudioInputOption {
  deviceId: string;
  label: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface LiveSpeechInputProps {
  value: string;
  recognitionLanguageCode: string;
  disabled?: boolean;
  autoTranslateAfterStop?: boolean;
  onChange: (value: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onAutoTranslate?: (finalText: string) => void;
}

function joinTranscriptParts(
  baseText: string,
  finalizedText: string,
  interimText = ""
) {
  return [baseText, finalizedText, interimText]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRecognitionErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Allow microphone access and try again.";
    case "audio-capture":
      return "No microphone was found. Check your microphone connection and try again.";
    case "network":
      return "Speech recognition hit a network error. Check your connection and try again.";
    case "no-speech":
      return "No speech was detected. Try speaking again and keep the microphone close.";
    case "aborted":
      return "Speech recognition was stopped before it could finish.";
    default:
      return "Live speech recognition ran into an unexpected problem. Please try again.";
  }
}

function getMicrophoneErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Microphone permission was denied. Allow microphone access and try again.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No microphone was found. Connect a microphone and try again.";
      case "NotReadableError":
      case "TrackStartError":
        return "Your microphone is busy in another app. Close other audio apps and try again.";
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return "That microphone could not be selected. Try another input device.";
      default:
        return "The browser could not start microphone access. Please try again.";
    }
  }

  return "The browser could not start microphone access. Please try again.";
}

function getPermissionBadgeLabel(permissionState: MicrophonePermissionState) {
  switch (permissionState) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Denied";
    case "unsupported":
      return "Unsupported";
    case "prompt":
      return "Needs Access";
    default:
      return "Checking";
  }
}

export default function LiveSpeechInput({
  value,
  recognitionLanguageCode,
  disabled = false,
  autoTranslateAfterStop = false,
  onChange,
  onListeningChange,
  onAutoTranslate,
}: LiveSpeechInputProps) {
  const recognitionConstructor = useMemo(
    () =>
      typeof window === "undefined"
        ? undefined
        : window.SpeechRecognition ?? window.webkitSpeechRecognition,
    []
  );

  const isRecognitionSupported = Boolean(recognitionConstructor);
  const isMediaDevicesSupported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(navigator.mediaDevices?.enumerateDevices);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Allow microphone access, then click Start Listening to begin live dictation."
  );
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] =
    useState<MicrophonePermissionState>("unknown");
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [microphones, setMicrophones] = useState<AudioInputOption[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [microphoneMessage, setMicrophoneMessage] = useState<string | null>(
    null
  );

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const baseTextRef = useRef("");
  const finalizedTextRef = useRef("");
  const lastErrorRef = useRef<string | null>(null);
  const valueRef = useRef(value);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  const stopActiveStream = useCallback(() => {
    if (!activeStreamRef.current) {
      return;
    }

    activeStreamRef.current.getTracks().forEach((track) => track.stop());
    activeStreamRef.current = null;
  }, []);

  const loadAvailableMicrophones = useCallback(
    async (preferredDeviceId?: string) => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setMicrophones([]);
        return [];
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }));

      setMicrophones(audioInputs);

      setSelectedMicrophoneId((currentValue) => {
        if (
          preferredDeviceId &&
          audioInputs.some((device) => device.deviceId === preferredDeviceId)
        ) {
          return preferredDeviceId;
        }

        if (
          currentValue &&
          audioInputs.some((device) => device.deviceId === currentValue)
        ) {
          return currentValue;
        }

        return audioInputs[0]?.deviceId ?? "";
      });

      return audioInputs;
    },
    []
  );

  const requestMicrophoneAccess = useCallback(
    async (preferredDeviceId?: string, keepStream = false) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicrophonePermission("unsupported");
        setMicrophoneMessage(
          "Microphone access is not available in this browser."
        );
        return null;
      }

      setIsRequestingMicrophone(true);
      setMicrophoneMessage(null);
      setRecognitionError(null);

      if (keepStream) {
        stopActiveStream();
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: preferredDeviceId
            ? { deviceId: { exact: preferredDeviceId } }
            : true,
        });

        const audioTrack = stream.getAudioTracks()[0] ?? null;
        const actualDeviceId =
          audioTrack?.getSettings().deviceId ?? preferredDeviceId;

        setMicrophonePermission("granted");
        await loadAvailableMicrophones(actualDeviceId);

        const selectedLabel = actualDeviceId
          ? (await navigator.mediaDevices.enumerateDevices()).find(
              (device) =>
                device.kind === "audioinput" &&
                device.deviceId === actualDeviceId
            )?.label
          : null;

        setStatusMessage(
          selectedLabel
            ? `Microphone access granted. ${selectedLabel} is ready for live dictation.`
            : "Microphone access granted. You can start listening now."
        );

        if (keepStream) {
          activeStreamRef.current = stream;
          return stream;
        }

        stream.getTracks().forEach((track) => track.stop());
        return null;
      } catch (error) {
        if (keepStream) {
          stopActiveStream();
        }

        const nextMessage = getMicrophoneErrorMessage(error);
        setMicrophonePermission(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "denied"
            : "prompt"
        );
        setMicrophoneMessage(nextMessage);
        setRecognitionError(nextMessage);
        setStatusMessage(
          "Microphone access is required before live dictation can start."
        );
        return null;
      } finally {
        setIsRequestingMicrophone(false);
      }
    },
    [loadAvailableMicrophones, stopActiveStream]
  );

  const handleMicrophoneSelection = useCallback(
    async (deviceId: string) => {
      setSelectedMicrophoneId(deviceId);
      setMicrophoneMessage(null);
      setRecognitionError(null);

      if (microphonePermission !== "granted") {
        return;
      }

      const stream = await requestMicrophoneAccess(deviceId, false);
      if (stream === null) {
        const selectedDevice = microphones.find(
          (device) => device.deviceId === deviceId
        );
        if (selectedDevice) {
          setStatusMessage(
            `${selectedDevice.label} is selected for the next live dictation session.`
          );
        }
      }
    },
    [microphonePermission, microphones, requestMicrophoneAccess]
  );

  const startListening = useCallback(async () => {
    if (!recognitionConstructor || disabled || isListening) {
      return;
    }

    if (!isMediaDevicesSupported) {
      const unsupportedMessage =
        "Microphone access is not available in this browser. Please use Chrome or Edge, or type your text manually.";
      setMicrophonePermission("unsupported");
      setMicrophoneMessage(unsupportedMessage);
      setRecognitionError(unsupportedMessage);
      return;
    }

    const stream = await requestMicrophoneAccess(selectedMicrophoneId, true);
    if (!stream) {
      return;
    }

    const recognition = new recognitionConstructor();
    const audioTrack = stream.getAudioTracks()[0] ?? undefined;
    const selectedMicrophone = microphones.find(
      (device) => device.deviceId === selectedMicrophoneId
    );

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLanguageCode;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    baseTextRef.current = valueRef.current.trim();
    finalizedTextRef.current = "";
    lastErrorRef.current = null;
    setInterimTranscript("");
    setRecognitionError(null);
    setMicrophoneMessage(null);
    setStatusMessage(
      selectedMicrophone
        ? `Listening... speak now using ${selectedMicrophone.label}.`
        : "Listening... speak now."
    );

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalizedText = "";
      let interimText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalizedText += transcript;
        } else {
          interimText += transcript;
        }
      }

      const normalizedFinal = finalizedText.trim();
      const normalizedInterim = interimText.trim();
      finalizedTextRef.current = joinTranscriptParts(
        baseTextRef.current,
        normalizedFinal
      );
      setInterimTranscript(normalizedInterim);
      onChange(
        joinTranscriptParts(
          baseTextRef.current,
          normalizedFinal,
          normalizedInterim
        )
      );
    };

    recognition.onerror = (event) => {
      const message = getRecognitionErrorMessage(event.error);
      lastErrorRef.current = message;
      setRecognitionError(message);
      setStatusMessage("Microphone needs attention before dictation can continue.");
    };

    recognition.onend = () => {
      const finalText = finalizedTextRef.current || valueRef.current.trim();

      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
      stopActiveStream();

      if (finalText !== valueRef.current) {
        onChange(finalText);
      }

      if (lastErrorRef.current) {
        return;
      }

      if (finalText) {
        setStatusMessage(
          "Listening stopped. You can edit the text or translate it."
        );
      } else {
        setStatusMessage(
          "Listening stopped. Start again or type your text manually."
        );
      }

      if (autoTranslateAfterStop && finalText && onAutoTranslate) {
        onAutoTranslate(finalText);
      }
    };

    try {
      recognition.start(audioTrack);
    } catch {
      try {
        recognition.start();
        setMicrophoneMessage(
          "Your browser is controlling the active microphone for speech recognition. If the wrong input is used, switch the browser or system default microphone."
        );
      } catch {
        recognitionRef.current = null;
        stopActiveStream();
        setRecognitionError(
          "Live speech recognition could not start. Please try again."
        );
        setStatusMessage(
          "Live speech recognition could not start. Please try again."
        );
      }
    }
  }, [
    autoTranslateAfterStop,
    disabled,
    isListening,
    isMediaDevicesSupported,
    microphones,
    onAutoTranslate,
    onChange,
    recognitionConstructor,
    recognitionLanguageCode,
    requestMicrophoneAccess,
    selectedMicrophoneId,
    stopActiveStream,
  ]);

  const stopRecognitionSession = useCallback((abort = false) => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    if (abort) {
      recognition.abort();
    } else {
      recognition.stop();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!isListening) {
      return;
    }

    setStatusMessage("Stopping microphone...");
    stopRecognitionSession();
  }, [isListening, stopRecognitionSession]);

  const clearText = useCallback(() => {
    setRecognitionError(null);
    setInterimTranscript("");
    setStatusMessage("Text cleared. Start listening when you are ready.");
    finalizedTextRef.current = "";
    baseTextRef.current = "";
    onChange("");
  }, [onChange]);

  useEffect(() => {
    if (!isRecognitionSupported) {
      setRecognitionError(
        "Live speech recognition is not supported in this browser. Please use Chrome or Edge, or type your text manually."
      );
      setStatusMessage(
        "Speech recognition unavailable in this browser. You can still type manually."
      );
    }

    if (!isMediaDevicesSupported) {
      setMicrophonePermission("unsupported");
      setMicrophoneMessage(
        "This browser cannot request microphone devices for live dictation."
      );
      return;
    }

    let isActive = true;
    const handleDeviceChange = () => {
      void loadAvailableMicrophones();
    };

    void loadAvailableMicrophones();

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((permissionStatus) => {
          if (!isActive) {
            return;
          }

          permissionStatusRef.current = permissionStatus;
          setMicrophonePermission(
            permissionStatus.state as Exclude<
              MicrophonePermissionState,
              "unknown" | "unsupported"
            >
          );

          permissionStatus.onchange = () => {
            if (!isActive) {
              return;
            }

            setMicrophonePermission(
              permissionStatus.state as Exclude<
                MicrophonePermissionState,
                "unknown" | "unsupported"
              >
            );

            if (permissionStatus.state === "granted") {
              setMicrophoneMessage(null);
              void loadAvailableMicrophones();
            }
          };
        })
        .catch(() => {
          if (isActive) {
            setMicrophonePermission("prompt");
          }
        });
    } else {
      setMicrophonePermission("prompt");
    }

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      isActive = false;
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
      }
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [isMediaDevicesSupported, isRecognitionSupported, loadAvailableMicrophones]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        stopRecognitionSession(true);
      }

      stopActiveStream();
    };
  }, [stopActiveStream, stopRecognitionSession]);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/80">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Microphone Access
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Allow microphone access to reveal available input devices and
              start live dictation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void requestMicrophoneAccess(selectedMicrophoneId, false);
            }}
            disabled={disabled || isListening || isRequestingMicrophone}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-200 dark:disabled:border-slate-800 dark:disabled:text-slate-500"
          >
            {isRequestingMicrophone ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Requesting Access...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {microphonePermission === "granted"
                  ? "Refresh Microphones"
                  : "Allow Microphone Access"}
              </>
            )}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Available Microphones
            </label>
            <select
              value={selectedMicrophoneId}
              onChange={(event) => {
                void handleMicrophoneSelection(event.target.value);
              }}
              disabled={
                disabled ||
                isListening ||
                microphonePermission !== "granted" ||
                microphones.length === 0
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
            >
              {microphones.length === 0 ? (
                <option value="">
                  {microphonePermission === "granted"
                    ? "No microphones detected"
                    : "Allow access to load microphones"}
                </option>
              ) : (
                microphones.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm ${
              microphonePermission === "granted"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                : microphonePermission === "denied"
                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200"
                  : "bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-300"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            {getPermissionBadgeLabel(microphonePermission)}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          We will try to start recognition with the microphone you choose. Some
          browsers still route Web Speech recognition through the active
          browser or system microphone, so the dropdown is best-effort rather
          than guaranteed in every browser.
        </p>

        {microphoneMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
            {microphoneMessage}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void startListening();
            }}
            disabled={
              disabled ||
              isListening ||
              !isRecognitionSupported ||
              isRequestingMicrophone
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            <Mic className="h-4 w-4" />
            Start Listening
          </button>

          <button
            type="button"
            onClick={stopListening}
            disabled={disabled || !isListening}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-rose-400 dark:hover:text-rose-300 dark:disabled:border-slate-800 dark:disabled:text-slate-500"
          >
            <Square className="h-4 w-4" />
            Stop Listening
          </button>

          <button
            type="button"
            onClick={clearText}
            disabled={
              disabled || isListening || (!value.trim() && !interimTranscript)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:text-white dark:disabled:border-slate-800 dark:disabled:text-slate-500"
          >
            <Trash2 className="h-4 w-4" />
            Clear Text
          </button>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm ${
            isListening
              ? "bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-200"
              : "bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          {isListening ? (
            <Radio className="h-3.5 w-3.5" />
          ) : (
            <Waves className="h-3.5 w-3.5" />
          )}
          {isListening ? "Listening" : "Idle"}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Live Transcript
        </label>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          readOnly={isListening}
          placeholder="Your live speech transcript will appear here. You can edit it after listening stops."
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 read-only:cursor-not-allowed read-only:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400 dark:read-only:bg-slate-900/60"
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{statusMessage}</span>
      </div>

      {interimTranscript && (
        <div className="rounded-xl border border-dashed border-teal-300 bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:border-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
          <span className="font-semibold">Interim:</span> {interimTranscript}
        </div>
      )}

      {recognitionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
          {recognitionError}
        </div>
      )}
    </div>
  );
}
