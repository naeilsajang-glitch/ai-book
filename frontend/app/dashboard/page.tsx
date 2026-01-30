'use client';

import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Book } from '@/lib/types';
import { BookCard } from '@/components/BookCard';
import { UploadModal } from '@/components/UploadModal';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
// I didn't install 'alert'. I should probably just use a div or install it. 
// Efficient path: use simple div for error state to avoid another install round-trip unless critical.
// Actually, I'll use Sonner for toast errors, but for page load error a simple div is fine.

export default function DashboardPage() {
    const [supabase] = useState(() => createClient()); // Initialize client

    // We can use Supabase subscription for realtime, or React Query for polling
    const { data: books, isLoading, error } = useQuery({
        queryKey: ['books'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Book[];
        },
        refetchInterval: (query) => {
            // If any book is processing, poll every 2 seconds
            const data = query.state.data as Book[] | undefined;
            if (data?.some((book) => book.status === 'processing')) {
                return 2000;
            }
            return false;
        }
    });

    // Optional: Realtime subscription
    // useEffect(() => {
    //     const channel = supabase.channel('realtime books')
    //         .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
    //             queryClient.invalidateQueries({ queryKey: ['books'] });
    //         })
    //         .subscribe();
    //     return () => { supabase.removeChannel(channel); }
    // }, [supabase, queryClient]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-10 text-center text-red-500">
                <h2 className="text-xl font-bold mb-2">Failed to load books</h2>
                <p>{(error as any).message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your AI-enhanced books and personas.
                    </p>
                </div>
                <UploadModal />
            </div>

            {books?.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-slate-50">
                    <h3 className="text-lg font-medium text-gray-900">No books found</h3>
                    <p className="text-gray-500 mt-1 mb-4">Upload your first PDF to get started.</p>
                    <UploadModal />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books?.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
            )}
        </div>
    );
}
