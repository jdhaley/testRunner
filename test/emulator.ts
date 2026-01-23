import { Message, MessageReceiver, MessageSender } from "../src/msg";
import { Orchestrator } from "../src/msg-receiver";
import { TcpReceiver, TcpConnection, TcpClient } from "../src/tcp";

export class Emulator implements TcpReceiver, MessageSender {
    constructor(
        private name: string,
        private connection: TcpConnection,
        private receiver: MessageReceiver
    ) { }

    getMessageLength(buffer: Buffer): number {
        if (buffer.length < 4) return -1;
        const totalLength = buffer.readUInt32BE(0);
        return buffer.length >= totalLength ? totalLength : -1;
    }

    send(msg: Message): void {
        const payload = Buffer.from(msg.payload?.content || "", "utf8");
        const raw = Buffer.alloc(4 + payload.length);
        raw.writeUInt32BE(4 + payload.length, 0);  // TOTAL length
        payload.copy(raw, 4);
        this.connection.send(raw);
    }

    receive(buffer: Buffer): void {
        const totalLength = buffer.readUInt32BE(0);
        const raw = buffer.subarray(4, totalLength);
        const msg: Message = {
            emulatorName: this.name,
            payload: {
                content: raw.toString("utf8")
            }
        }
        this.receiver.receive(msg);
    }
}

export class ClientEmulator extends Emulator {
    constructor(name: string, host: string, port: number, orch: Orchestrator) {
        const client = new TcpClient(host, port);
        super(name, client, orch);
        client.setReceiver(this);
        orch.setSender(name, this);
    }
}