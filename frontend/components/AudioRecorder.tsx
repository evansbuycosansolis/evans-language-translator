"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, TimerReset, CircleAlert } from "lucide-react";

export interface RecordedAudio {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
  filename: string;
}

interface AudioRecorderProps {
  maxDurationSeconds: number;
  disabled?: boolean;
  onRecordingReady: (recording: RecordedAudio) => void;
  onRecordingStart?: () => void;
  onError?: (message: string) => void;
}

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  return MIME_TYPE_CANDIDATES.find((candidate) =>
    MediaRecorder.isTypeSupported(candidate)
  );
}

function getFileExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) {
    return "mp4";
  }
  if (mimeType.includes("ogg")) {
    return "ogg";
  }
  return "webm";
}

export default function AudioRecorder({
  maxDurationSeconds,
  disabled = false,
  onRecordingReady,
  onRecordingStart,
  onError,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recorderMessage, setRecorderMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedSecondsRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const resetPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }
    mediaRecorderRef.current.stop();
  };

  const startRecording = async () => {
    if (disabled) {
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof MediaRecorder === "undefined"
    ) {
      const message =
        "This browser does not support microphone recording with MediaRecorder.";
      setRecorderMessage(message);
      onError?.(message);
      return;
    }

    try {
      resetPreview();
      setRecorderMessage(null);
      setElapsedSeconds(0);
      elapsedSecondsRef.current = 0;
      onRecordingStart?.();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearTimers();
        stopTracks();
        setIsRecording(false);

        const finalMimeType =
          mediaRecorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        if (audioBlob.size === 0) {
          const message = "No audio was captured. Please try recording again.";
          setRecorderMessage(message);
          onError?.(message);
          return;
        }

        const nextPreviewUrl = URL.createObjectURL(audioBlob);
        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
        setRecorderMessage("Recording ready. Review it below, then translate it.");

        onRecordingReady({
          blob: audioBlob,
          mimeType: finalMimeType,
          durationSeconds: Math.max(elapsedSecondsRef.current, 1),
          filename: `recording.${getFileExtension(finalMimeType)}`,
        });
      };

      mediaRecorder.start();
      setIsRecording(true);

      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((current) => {
          const next = current >= maxDurationSeconds ? current : current + 1;
          elapsedSecondsRef.current = next;
          return next;
        });
      }, 1000);

      timeoutRef.current = window.setTimeout(() => {
        setRecorderMessage(
          `Maximum recording length of ${maxDurationSeconds} seconds reached.`
        );
        stopRecording();
      }, maxDurationSeconds * 1000);
    } catch (error) {
      stopTracks();
      clearTimers();
      setIsRecording(false);

      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access and try again."
          : "Could not start microphone recording. Please check your device and browser permissions.";
      setRecorderMessage(message);
      onError?.(message);
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
      stopTracks();
      resetPreview();
    };
    // previewUrl is intentionally omitted so cleanup runs only on unmount
    // and when resetPreview is called explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || isRecording}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={disabled || !isRecording}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-rose-400 dark:hover:text-rose-300 dark:disabled:border-slate-800 dark:disabled:text-slate-500"
          >
            <Square className="h-4 w-4" />
            Stop Recording
          </button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          <TimerReset className="h-3.5 w-3.5" />
          {isRecording
            ? `Recording ${elapsedSeconds}s / ${maxDurationSeconds}s`
            : `Max ${maxDurationSeconds}s`}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Record first, then translate. Audio is only uploaded after you stop
        recording, which helps control API cost and keeps the experience simple.
      </p>

      {recorderMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{recorderMessage}</span>
        </div>
      )}

      {previewUrl && (
        <audio
          controls
          src={previewUrl}
          preload="none"
          className="w-full"
        />
      )}
    </div>
  );
}
