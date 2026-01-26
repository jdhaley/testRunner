import { Receiver, Sender } from "./msg";

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
    body: T;
}

export class MessageCodec implements Receiver<Buffer>, Sender<Message> {
    constructor(
        private name: string,
        private sender: Sender<Buffer>,
        private receiver: Receiver<Message>
    ) { }

    getMessageLength(buffer: Buffer): number {
        if (buffer.length < 4) return -1;
        const totalLength = buffer.readUInt32BE(0);
        return buffer.length >= totalLength ? totalLength : -1;
    }

    receive(buffer: Buffer): void {
        const totalLength = buffer.readUInt32BE(0);
        const raw = buffer.subarray(4, totalLength);
        const msg: Message = {
            header: {
                channel: this.name
            },
            body: {
                content: raw.toString("utf8")
            }
        }
        this.receiver.receive(msg);
    }

    send(msg: Message): void {
        const payload = Buffer.from(msg.body?.content || "", "utf8");
        const raw = Buffer.alloc(4 + payload.length);
        raw.writeUInt32BE(4 + payload.length, 0);  // TOTAL length
        payload.copy(raw, 4);
        this.sender.send(raw);
    }
}

export class Senders implements Sender<Message> {
    private senders: Record<string, Sender<Message>> = {}

    public addSender(name: string, sender: Sender<Message>) {
        this.senders[name] = sender;
    }

    public send(message: Message) {
        const channel = message?.header?.channel;
        if (!channel) {
            console.error("No channel defined for message: ", message);
            return;
        }
        const sender = this.senders[channel];
        if (!sender) {
            console.error("No sender defined for channel: ", channel);
            return;
        }
        if (sender) sender.send(message);
    }
}