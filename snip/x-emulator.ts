import { Message } from "../src/msg";


export interface MessageSender {
    send(m: Message): void;
}

export interface MessageReceiver {
    receive(m: Message): void;
}

export class Emulator {
    constructor(
        public name: string,
        private sender: MessageSender,
        private receiver: MessageReceiver
    ) { }

    send(m: Message): void {
        this.sender.send(m);
    }

    receive(m: Message) {
        this.receiver.receive(m);
    }
}

//import { LengthFramingTcpEmulator } from "../src/tcp-emulator";
// class TestSim extends LengthFramingTcpEmulator {
//     protected getMessageLength(buffer: Buffer): number {
//         return buffer.readUInt32BE(0);
//     }
    
//     protected getPayload(buffer: Buffer) {
//         return buffer.subarray(this.headerSize, this.getMessageLength(buffer));
//     }

//     protected unmarshal(content: Buffer): Message {
//         const payload = this.getPayload(content).toString("utf8");
//         return {
//             emulatorName: this.name,
//             payload: {
//                 content: payload
//             }
//         }
//     }

//     protected marshal(message: Message): Buffer {
//         const content = message.payload?.content ?? "";
//         const payload = Buffer.from(content, "utf8");
//         const buf = Buffer.alloc(this.headerSize + payload.length);
//         buf.writeUInt32BE(this.headerSize + payload.length, 0);
//         payload.copy(buf, this.headerSize);
//         return buf;
//     }
// }
