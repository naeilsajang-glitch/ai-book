'use client';

import { use, useEffect, useState } from 'react'; // Next.js 15: params is a Promise, need use() or await
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import api from '@/lib/api';
import { Book, ChatMessage } from '@/lib/types';
import { useChatStream } from '@/hooks/useChatStream';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { ChatBubble } from '@/components/ChatBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, StopCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: PageProps) {
    // Unleash params
    const { id: bookId } = use(params);

    // Initialize Supabase
    const [supabase] = useState(() => createClient());

    // Fetch Book Details for Sidebar (Directly from Supabase)
    const { data: book, isLoading } = useQuery({
        queryKey: ['book', bookId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .single();

            if (error) throw error;
            return data as Book;
        }
    });

    // Fetch Chat History (Directly from Supabase)
    const { data: history, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['chat', bookId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('book_id', bookId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as ChatMessage[];
        }
    });

    const { messages, isStreaming, sendMessage, stopGeneration } = useChatStream({
        bookId,
        initialHistory: history
    });

    const scrollRef = useAutoScroll(messages);

    const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem('message') as HTMLInputElement;
        if (input.value) {
            sendMessage(input.value);
            input.value = '';
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!book) {
        return <div className="p-10 text-center">Book not found</div>;
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:flex w-80 flex-col border-r bg-muted/20 p-4">
                <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-6">
                    <h2 className="text-xl font-bold line-clamp-2 mb-2">{book.title}</h2>
                    <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                        Ready
                    </span>
                </div>

                <div className="text-sm text-muted-foreground">
                    <h4 className="font-semibold mb-2 text-foreground">About this book</h4>
                    <p>
                        File hash: <code className="text-xs bg-muted p-1 rounded font-mono">{book.file_hash.substring(0, 8)}...</code>
                    </p>
                    <p className="mt-2">
                        Created: {new Date(book.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Mobile Header */}
                <div className="md:hidden border-b p-4 flex items-center bg-background z-10">
                    <Link href="/dashboard" className="mr-4">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="font-semibold truncate">{book.title}</h1>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50 space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Send className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium">Start a conversation with this book.</p>
                            <p className="text-sm max-w-xs">Ask questions, request summaries, or explore specific topics to get started.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <ChatBubble key={msg.id} role={msg.role} content={msg.content} isStreaming={isStreaming && msg.role === 'assistant' && msg.id === messages[messages.length - 1].id} />
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                    <div className="max-w-3xl mx-auto relative">
                        {isStreaming && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                <Button variant="secondary" size="sm" onClick={stopGeneration} className="shadow-md">
                                    <StopCircle className="mr-2 h-4 w-4" />
                                    Stop Generating
                                </Button>
                            </div>
                        )}
                        <form onSubmit={handleSend} className="flex gap-2">
                            <Input
                                name="message"
                                placeholder="Ask something about the book..."
                                className="flex-1"
                                autoComplete="off"
                                disabled={isStreaming}
                            />
                            <Button type="submit" disabled={isStreaming}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
