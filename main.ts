import { Message } from "./model";
import { Orchestrator } from "./orchestrator";
import { LengthFramingTcpEmulator } from "./tcp-emulator";
import { Tester } from "./tester";

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

class TestSut extends TestSim {
    // Whenever a message is received, convert the payload to upper case and send it out.
    protected unmarshal(content: Buffer): Message {
        const msg = super.unmarshal(content);
        msg.payload["content"] = ("" + msg.payload["content"]).toUpperCase();
        this.send(msg);
        return msg;
    }
}
const sutUrl = {
    host: "127.0.0.1",
    port: 1410
}
const em1 = new TestSim("UPPERCASER", 1410, sutUrl);

const otr = new Orchestrator(3000, em1);
const tester = new Tester(otr);
