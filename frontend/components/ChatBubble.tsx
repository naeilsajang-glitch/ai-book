import { ChatRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

interface ChatBubbleProps {
    role: ChatRole;
    content: string;
    isStreaming?: boolean;
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
    const isUser = role === 'user';

    return (
        <div
            className={cn(
                'flex w-full mb-4',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            <div
                className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm md:text-base',
                    isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-muted-foreground rounded-tl-sm'
                )}
            >
                {isStreaming && !content ? (
                    <div className="flex items-center space-x-1 h-6">
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    </div>
                ) : (
                    <div className={cn('prose dark:prose-invert max-w-none hover:prose-a:text-blue-500', isUser ? 'text-white' : '')}>
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
