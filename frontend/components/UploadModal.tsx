'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';

interface UploadFormData {
    file: FileList;
}

export function UploadModal() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadFormData>();

    const [supabase] = useState(() => createClient());

    const uploadMutation = useMutation({
        mutationFn: async (data: UploadFormData) => {
            const file = data.file[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`; // In root or subfolder? let's use root for simple MVP or user_id folder if auth exists.

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('books')
                .upload(filePath, file);

            if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

            // 2. Insert into DB (Status: processing)
            const { data: bookData, error: dbError } = await supabase
                .from('books')
                .insert({
                    title: file.name.replace('.pdf', ''),
                    file_path: filePath,
                    status: 'processing'
                })
                .select()
                .single();

            if (dbError) throw new Error(`DB Error: ${dbError.message}`);

            // 3. Call Backend to Trigger Processing
            // We only need to send the book_id (and file_path redundant but helpful)
            await api.post('/books/process-book', {
                book_id: bookData.id,
                file_path: filePath,
                bucket_name: 'books'
            });

            return bookData;
        },
        onSuccess: () => {
            toast.success('Book uploaded & processing started');
            queryClient.invalidateQueries({ queryKey: ['books'] });
            setOpen(false);
            reset();
        },
        onError: (error: any) => {
            const msg = error.message || 'Upload failed';
            toast.error(msg);
            console.error(error);
        },
    });

    const onSubmit = (data: UploadFormData) => {
        if (data.file.length === 0) return;
        uploadMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Book
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload PDF</DialogTitle>
                    <DialogDescription>
                        Select a PDF file to upload. It will be analyzed for chat.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="file" className="text-right">
                                File
                            </Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                className="col-span-3"
                                {...register('file', { required: true })}
                            />
                        </div>
                        {errors.file && <p className="text-red-500 text-sm md-4">File is required</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={uploadMutation.isPending}>
                            {uploadMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Upload
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
