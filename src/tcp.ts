import { Message, Receiver } from "./model";
import { startServer, createConnection } from "./tcp-utils";
import { Server, Socket } from "net";

export abstract class TcpServer {
    private buffer: Buffer = Buffer.alloc(0);
    private server?: Server;
    private receiver?: Receiver;
    constructor(
        private listenPort: number,
        private unmarshaller: Unmarshaller
    ) { }

    async start(receiver: Receiver): Promise<void> {
        if (this.receiver) console.warn("Restarting emulator without it being stopped first.")
        this.receiver = receiver;
        if (!this.server) this.server = await startServer(this.listenPort, (socket) => {
            socket.on("data", (chunk: Buffer) => this.processChunk(chunk));
        });
    }

    async stop(): Promise<void> {
        //this.server && await stopServer(this.server);
        this.receiver = undefined;
    }

    protected forward(message: Message) {
        if (this.receiver) {
            this.receiver.receive(message);
        } else {
            console.error("Message receiver is undefined (Server not started or is stopped)", message);
        }
    }

    protected processChunk(chunk: Buffer) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        while (this.unmarshaller.isMessageAvail(this.buffer)) {
            const msgLength = this.unmarshaller.getMessageLength(this.buffer);
            const rawMessage = this.buffer.subarray(0, msgLength);

            this.buffer = this.buffer.subarray(msgLength);
            
            const msg = this.unmarshaller.unmarshal(rawMessage);
            this.forward(msg);
        }
    }

}

export abstract class Unmarshaller {
    isMessageAvail(buffer: Buffer) {
        return buffer.length >= this.getHeaderLength(buffer)
            && buffer.length >= this.getMessageLength(buffer);
    }

    abstract getHeaderLength(buffer: Buffer): number;

    // e.g. buffer.readUInt32BE(0);
    abstract getMessageLength(buffer: Buffer): number;

    abstract unmarshal(buffer: Buffer): Message;
}

export abstract class TcpClient {
    private clientSocket?: Socket;

    constructor(
        private server: {
            host: string,
            port: number,
        }
    ) { }

    public async send(m: Message): Promise<void> {
        const socket = await this.getClient();
        socket.write(this.marshal(m));
    }

    protected abstract marshal(message: Message): Buffer;

    private async getClient(): Promise<Socket> {
        if (this.clientSocket && !this.clientSocket.destroyed) {
            return this.clientSocket;
        }
        const socket = await createConnection(this.server);
        this.clientSocket = socket;
        return socket;
    }
}