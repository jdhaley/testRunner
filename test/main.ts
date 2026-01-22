import { Message } from "../src/msg";
import { Orchestrator } from "../src/msg-receiver";
import { startServer, TcpClient, TcpConnection } from "../src/tcp";
import { Scenario, runScenarios } from "../src/test";
import { ClientEmulator, Emulator } from "./emulator";

const sutHost = "127.0.0.1";
const sutPort = 1410;

export class Sut {
    constructor(connection: TcpConnection) { 
        this.emulator = new Emulator("SUT", connection, this);
        connection.setReceiver(this.emulator);
    }
    private emulator: Emulator;

    receive(m: Message): void {
        m.payload.content = "" + m.payload.content.toUpperCase();
        this.send(m);
    }
    send(m: Message) {
        this.emulator.send(m);
    }
}
startServer(sutPort, (conn: TcpConnection) => new Sut(conn));

const otr = new Orchestrator(3000);
new ClientEmulator("EM1", sutHost, sutPort, otr);
new ClientEmulator("EM2", sutHost, sutPort, otr);

const scenarios: Scenario[] = [
]

const testResut = runScenarios(scenarios);

console.log(testResut);