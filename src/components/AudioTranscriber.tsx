import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, Check, AlertCircle } from 'lucide-react';

interface AudioTranscriberProps {
  onTranscriptionComplete: (text: string) => void;
  buttonLabel?: string;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  onTranscriptionComplete,
  buttonLabel = 'Voice Dictation (gemini-3.5-transcribe)',
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());

        // Convert to Base64
        setIsProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: 'audio/webm',
              }),
            });

            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }

            if (data.transcription) {
              onTranscriptionComplete(data.transcription);
            }
            setIsProcessing(false);
          };
        } catch (err: any) {
          console.error('Transcription error:', err);
          setError(err.message || 'Failed to transcribe audio');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setError('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-500/30 bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 text-xs font-medium transition-colors disabled:opacity-50"
          title="Transcribe clinical symptoms or notes via microphone"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Transcribing with gemini-3.5-transcribe...</span>
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/50 bg-rose-950 text-rose-300 text-xs font-semibold animate-pulse transition-colors"
        >
          <MicOff className="h-3.5 w-3.5" />
          <span>Stop Recording (Listening...)</span>
        </button>
      )}

      {error && (
        <span className="text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
};
