import net from "net";

/**
 * Promise-based wrapper for net.createConnection
 */
export function createConnection(options: net.NetConnectOpts): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(options, () => {
            resolve(socket);
        });
        socket.on("error", reject);
    });
}

/**
 * Promise-based wrapper for net.Server.listen
 */
export function listen(server: net.Server, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
        server.listen(port, () => resolve());
        server.on("error", reject);
    });
}

export function startServer(port: number, connectionHandler: (socket: net.Socket) => any): Promise<net.Server> {
    return new Promise((resolve, reject) => {
        const server = net.createServer((socket) => {
            connectionHandler(socket);
        });
        server.listen(port, () => resolve(server));
        server.on("error", reject);
    });
}

/**
 * Promise-based wrapper for net.Server.close
 */
export function stopServer(server: net.Server): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
