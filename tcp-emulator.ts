import { Emulator, Message, Receiver } from "./model";
import { startServer, stopServer, createConnection } from "./net-utils";
import { Server, Socket } from "net";

/**
 * TCP Emulator
 *
 * - Listens on a TCP port for messages from the SUT
 * - Sends messages to the SUT via TCP
 */
export abstract class TcpEmulator implements Emulator {
    private server?: Server;
    private clientSocket?: Socket;
    protected receiver?: Receiver;
    constructor(
        public name: string,
        private listenPort: number,
        private remote: {
            host: string,
            port: number,
        }
    ) { }

    /* ----------------------------
     * Server side (receive)
     * ---------------------------- */

    async start(receiver: Receiver): Promise<void> {
        if (this.receiver) console.warn("Restarting emulator without it being stopped first.")
        this.receiver = receiver;
        if (!this.server) this.server = await startServer(this.listenPort, (socket) => {
            socket.on("data", (chunk: Buffer) => this.processChunk(chunk));
        });
    }
    
    async stop(): Promise<void> {
        this.server && await stopServer(this.server);
        this.receiver = undefined;
    }

    protected abstract processChunk(chunk: Buffer): void;
    protected abstract unmarshal(content: Buffer): Message;

    /* ----------------------------
     * Client side (send)
     * ---------------------------- */

    public async send(m: Message): Promise<void> {
        const socket = await this.getClient();
        socket.write(this.marshal(m));
    }

    protected abstract marshal(message: Message): Buffer; 

    private async getClient(): Promise<Socket> {
        if (this.clientSocket && !this.clientSocket.destroyed) {
            return this.clientSocket;
        }
        const socket = await createConnection(this.remote);
        this.clientSocket = socket;
        return socket;
    }
}

export abstract class LengthFramingTcpEmulator extends TcpEmulator {
    protected headerSize = 4; // uint32
    private buffer: Buffer = Buffer.alloc(0);

    protected processChunk(chunk: Buffer) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
 
        const headerSize = this.headerSize;

        while (true) {
            // Not enough for header
            if (this.buffer.length < headerSize) return;

            const messageLength = this.getMessageLength(this.buffer);

            // Not enough for full message
            if (this.buffer.length < messageLength) return;

            const rawMessage = this.buffer.subarray(0, messageLength);

            this.buffer = this.buffer.subarray(messageLength);
            const message = this.unmarshal(rawMessage);
            if (this.receiver) {
                this.receiver.receive(message);
            } else {
                console.error("Message receiver is undefined (Sever stopped?) ", message);
            }
        }
    }

    // e.g. buffer.readUInt32BE(0);
    protected abstract getMessageLength(buffer: Buffer): number
}
