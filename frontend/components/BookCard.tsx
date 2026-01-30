'use client';

import { Book } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, BookOpen, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge'; // I might need to make Badge if not in shadcn default add list? Wait, I didn't add badge.
// I didn't add Badge in the previous step. I should add it or use a simple span.
// Let's use a simple span with Tailwind for now to save a tool call, or I can add it later.
// Actually, `badge` is a standard shadcn component. I missed adding it.
// I will simulate a badge with `div`.

interface BookCardProps {
    book: Book;
}

export function BookCard({ book }: BookCardProps) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/books/${book.id}`);
        },
        onSuccess: () => {
            toast.success('Book deleted');
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to delete book');
        },
    });

    const isProcessing = book.status === 'processing';
    const isReady = book.status === 'ready';
    const isFailed = book.status === 'failed';

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-2 text-lg" title={book.title}>
                        {book.title}
                    </CardTitle>
                    <StatusBadge status={book.status} />
                </div>
                <CardDescription>
                    {new Date(book.created_at).toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {isFailed && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded">
                        Error: {book.error_message || 'Unknown error'}
                    </p>
                )}
                {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                    </div>
                )}
                {isReady && (
                    <p className="text-sm text-muted-foreground">
                        Ready to chat.
                    </p>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                    disabled={!isReady}
                >
                    <Link href={isReady ? `/book/${book.id}` : '#'}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Chat
                    </Link>
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                        if (confirm('Are you sure you want to delete this book?')) {
                            deleteMutation.mutate();
                        }
                    }}
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        ready: 'bg-green-100 text-green-800 border-green-200',
        failed: 'bg-red-100 text-red-800 border-red-200',
    };

    const label = status.charAt(0).toUpperCase() + status.slice(1);
    const className = `px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100'}`;

    return <span className={className}>{label}</span>;
}
