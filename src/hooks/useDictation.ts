import { useCallback, useEffect, useRef, useState } from "react";

// Reconhecimento de voz nativo do navegador (Web Speech API).
// Funciona em Chrome/Edge/Safari (com prefixo webkit) com pt-BR. Sem chave.
type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
};

type SpeechErrorEvent = { error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useDictation({
  lang = "pt-BR",
  onResult,
}: {
  lang?: string;
  onResult: (text: string) => void;
}) {
  const Ctor = getRecognitionCtor();
  const supported = !!Ctor;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  const start = useCallback(() => {
    if (!Ctor) return;
    if (recognitionRef.current) return;
    try {
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) {
            onResultRef.current(result[0].transcript.trim());
          }
        }
      };
      rec.onerror = (e) => {
        setError(e.error || "speech-error");
        setListening(false);
        recognitionRef.current = null;
      };
      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "speech-init-failed");
    }
  }, [Ctor, lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    },
    [],
  );

  return { supported, listening, error, start, stop };
}
