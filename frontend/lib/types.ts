export interface User {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_superuser: boolean;
}

export type BookStatus = 'processing' | 'ready' | 'failed';

export interface Book {
    id: string;
    title: string;
    owner_id?: string;
    is_official: boolean;
    file_hash: string;
    status: BookStatus;
    error_message?: string;
    created_at: string; // ISO string
}

export interface Persona {
    id: string;
    book_id: string;
    role_name: string;
    system_prompt: string;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    user_id: string;
    book_id: string;
    role: ChatRole;
    content: string;
    created_at?: string;
}

export interface ChatHistoryResponse {
    history: ChatMessage[];
}

export interface BookUploadResponse {
    status: string;
    msg: string;
    book_id: string;
}
