export interface Header {
    channel?: string;
    corrId?: string;
    [key: string]: any;
}

export interface Body {
    [key: string]: any;
}

export interface Message<T = Body> {
    header: Header;
    body: Body;
}

export interface MessageSender {
    send(m: Message): void;
}

export interface MessageReceiver {
    receive(m: Message): void;
}
