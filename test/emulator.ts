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
        return buffer.readUInt32BE(0);
    }

    send(msg: Message): void {
        const payload = Buffer.from(msg.payload?.content || "", "utf8");
        const raw = Buffer.alloc(4 + payload.length);
        raw.writeUInt32BE(payload.length, 0);
        payload.copy(raw, 4);
        this.connection.send(raw);
    }

    receive(buffer: Buffer): void {
        const raw = buffer.subarray(4, this.getMessageLength(buffer));
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
        super(name, new TcpClient(host, port), orch);
        orch.setSender(name, this);
    }
}