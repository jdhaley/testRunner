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

    constructor(
        private listenPort: number,
        private remote: {
            host: string,
            port: number,
        },
        protected receiver: Receiver
    ) { }

    /* ----------------------------
     * Server side (receive)
     * ---------------------------- */

    async start(): Promise<void> {
        this.server = await startServer(this.listenPort, (socket) => {
            socket.on("data", (chunk: Buffer) => this.processChunk(chunk));
        });
    }
    async stop(): Promise<void> {
        this.server && await stopServer(this.server);
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

    protected abstract marshal(message: Message): string; 

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

            const payloadLength = this.getPayloadLength(this.buffer);

            // Not enough for full message
            if (this.buffer.length < headerSize + payloadLength) return;

            const payload = this.buffer.subarray(
                headerSize,
                headerSize + payloadLength
            );

            this.buffer = this.buffer.subarray(headerSize + payloadLength);
            const message = this.unmarshal(payload);
            this.receiver.receive(message);
        }
    }

    // e.g. buffer.readUInt32BE(0);
    protected abstract getPayloadLength(buffer: Buffer): number
}

