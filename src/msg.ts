export interface Message {
    channel?: string;
    corrId?: string;
    metadata?: Record<string, any>;
    payload: Record<string, any>;
}

export interface MessageSender {
    send(m: Message): void;
}

export interface MessageReceiver {
    receive(m: Message): void;
}
