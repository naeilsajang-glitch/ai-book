import { useState, useRef, useCallback } from 'react';
import { ChatMessage, ChatRole } from '@/lib/types';
import { toast } from 'sonner';

interface UseChatStreamProps {
    bookId: string;
    initialHistory?: ChatMessage[];
}

export function useChatStream({ bookId, initialHistory = [] }: UseChatStreamProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
    const [isStreaming, setIsStreaming] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync messages when initialHistory changes (e.g. after fetching)
    const prevHistoryRef = useRef(initialHistory);
    if (prevHistoryRef.current !== initialHistory) {
        prevHistoryRef.current = initialHistory;
        setMessages(initialHistory);
    }

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // 1. Add User Message immediately
        const userMessage: ChatMessage = {
            id: Date.now().toString(), // Temp ID
            user_id: 'me',
            book_id: bookId,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };

        // 2. Add empty AI Message placeholder
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessagePlaceholder: ChatMessage = {
            id: aiMessageId,
            user_id: 'ai',
            book_id: bookId,
            role: 'assistant',
            content: '', // Start empty
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage, aiMessagePlaceholder]);
        setIsStreaming(true);

        // 3. Setup AbortController
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            // 4. Fetch SSE
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiUrl}/books/${bookId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': ... (Add token here if needed)
                },
                body: JSON.stringify({ message: content }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();

                        if (dataStr === '[DONE]') break;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.content) {
                                aiContent += data.content;
                                // Update the last message (AI placeholder)
                                setMessages((prev) => {
                                    const newMsgs = [...prev];
                                    const lastMsg = newMsgs[newMsgs.length - 1];
                                    if (lastMsg.id === aiMessageId) {
                                        lastMsg.content = aiContent;
                                    }
                                    return newMsgs;
                                });
                            }
                            if (data.error) {
                                toast.error(`AI Error: ${data.error}`);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE json', e);
                        }
                    }
                }
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted');
                toast.info('Generation stopped');
            } else {
                console.error('Stream error', error);
                toast.error('Failed to send message');
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [bookId]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsStreaming(false);
        }
    }, []);

    return { messages, isStreaming, sendMessage, stopGeneration, setMessages };
}
