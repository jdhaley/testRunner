import { Message, MessageReceiver } from "../src/msg";
import { TcpConnection, TcpReceiver } from "../src/tcp";


// class Unmarshaller {
//     constructor(private name: string, private headerSize: number) { }
//     protected getMessageLength(buffer: Buffer): number {
//         return buffer.readUInt32BE(0);
//     }

//     protected getHeader(buffer: Buffer) {
//         return buffer.subarray(0, this.headerSize);
//     }

//     protected getPayload(buffer: Buffer) {
//         //.toString("utf8")
//         return buffer.subarray(this.headerSize, this.getMessageLength(buffer));
//     }

//     protected unmarshal(content: Buffer): Message {
//         const header = this.getHeader(content);
//         const payload = this.getPayload(content);
//         return {
//             emulatorName: this.name,
//             metadata: {
//                 header: header
//             },
//             payload: {
//                 content: payload
//             }
//         }
//     }
//     protected abstract toMessage(header: Buffer): Record
// }

// class Marshaller {
//     protected marshal(m: Message): Buffer {
//         const payload = this.marshallPayload(m);
//         const rawMessage = this.createBuffer(m, payload)
//         const hdrSize = this.getHeaderSize();
//         payload.copy(buf, hdrSize);
//         return buf;
//     }
//     protected create
//     protected marshallHeader() {
//         const buf = Buffer.alloc(hdrSize + payload.length);
//         buf.writeUInt32BE(hdrSize + payload.length, 0);
//     }
//     protected marshallPayload(payload: Record<string, any>) {
//         return Buffer.from(payload?.content || "", "utf8");
//     }
//     protected getHeaderSize() {
//         return 4;
//     }
// }
