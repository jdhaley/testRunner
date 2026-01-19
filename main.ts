import { Message } from "./model";
import { LengthFramingTcpEmulator } from "./tcp-emulator";

class TestSim extends LengthFramingTcpEmulator {
    protected getPayloadLength(buffer: Buffer): number {
        return buffer.readUInt32BE(0);
    }
    protected unmarshal(content: Buffer): Message {
        throw new Error("Method not implemented.");
    }
    protected marshal(message: Message): string {
        throw new Error("Method not implemented.");
    }
    
}