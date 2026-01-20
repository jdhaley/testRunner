import { Message, Receiver } from "./model";
import { startServer, stopServer, createConnection } from "./net-utils";
import { Server, Socket } from "net";

export abstract class TcpServer {
    private server?: Server;
    private receiver?: Receiver;
    constructor(
        private listenPort: number,
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