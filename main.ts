import { Emulator, Message } from "./model";
import { TestOrchestrator, TimedReceiver } from "./orchestrator";
import { LengthFramingTcpEmulator } from "./tcp-emulator";

class TestSim extends LengthFramingTcpEmulator {
    protected getMessageLength(buffer: Buffer): number {
        return buffer.readUInt32BE(0);
    }
    protected getPayload(buffer: Buffer) {
        return buffer.subarray(this.headerSize, this.getMessageLength(buffer));
    }
    protected unmarshal(content: Buffer): Message {
        const payload = this.getPayload(content).toString("utf8");
        return {
            emulatorName: this.name,
            payload: {
                content: payload
            }
        }
    }

    protected marshal(message: Message): Buffer {
        const content = message.payload?.content ?? "";
        const payload = Buffer.from(content, "utf8");
        const buf = Buffer.alloc(this.headerSize + payload.length);
        buf.writeUInt32BE(this.headerSize + payload.length, 0);
        payload.copy(buf, this.headerSize);
        return buf;
    }
}

const receiver = new TimedReceiver();
const em1Remote = {
    host: "127.0.0.1",
    port: 1411
}
const em1 = new TestSim("UPPERCASER", 1410, em1Remote, receiver);
const emulators = mapify(em1);
const ORCHESTRATOR = new TestOrchestrator(emulators, receiver, 3000);

function mapify(...emulators: Emulator[]): Record<string, Emulator> {
    return Object.fromEntries(emulators.map(e => [e.name, e]));
}