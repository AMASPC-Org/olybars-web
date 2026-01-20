export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'artie'; // 'artie' is kept for backward compatibility with Schmidt logging
    text: string;
    content?: string; // Legacy support
    timestamp: number;
    imageUrl?: string;
}
