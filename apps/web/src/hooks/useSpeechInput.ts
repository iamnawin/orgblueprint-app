"use client";

import { useState, useRef, useCallback } from "react";

interface UseSpeechInputResult {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// Uses browser-native Web Speech API (Chrome/Edge). Falls back gracefully elsewhere.
export function useSpeechInput(onTranscript: (text: string) => void): UseSpeechInputResult {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const getSpeechImpl = (): (new () => SpeechRecognitionLike) | null => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as Record<string, unknown>;
    return (w["SpeechRecognition"] || w["webkitSpeechRecognition"]) as (new () => SpeechRecognitionLike) | null;
  };

  const isSupported = getSpeechImpl() !== null;

  const startListening = useCallback(() => {
    const Impl = getSpeechImpl();
    if (!Impl) return;
    const recognition = new Impl();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
