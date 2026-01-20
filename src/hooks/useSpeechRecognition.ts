import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech Recognition not supported in this browser.');
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                // If it's already started, we don't want to show an error or reset isListening
                if (event.error === 'no-speech') {
                    setIsListening(false);
                } else if (event.error !== 'aborted') {
                    setError(event.error);
                    setIsListening(false);
                }
            };
            recognition.onresult = (event: any) => {
                const result = event.results[0][0].transcript;
                setTranscript(result);
            };
            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.warn('Silent cleanup of recognition');
                }
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                setTranscript('');
                setError(null);
                recognitionRef.current.start();
            } catch (e: any) {
                console.warn('SpeechRecognition start failed:', e);
                // Handle the case where the browser thinks it's already started
                if (e.name === 'InvalidStateError') {
                    // It's already running, no need to error out
                } else {
                    setError('Failed to start listening');
                }
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors on stop
            }
        }
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        isSupported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    };
};
