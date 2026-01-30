import { Orchestrator } from "../src/msg";
import { Message, Senders } from "../src/msg-base";
import { TcpConnection, TcpServer } from "../src/tcp";
import { demoExpectationFramework } from "../src/testing/test-expectation";
import { reportResult } from "../src/testing/test-report";
import { ClientEmulator, SutConnection } from "./emulator";
import { defineSuite as createExampleSuite } from "./scenarios";

/*
const sutHost = "127.0.0.1";
const sutPort = 1410;
const sut = new TcpServer(sutPort, (conn: TcpConnection) => new SutConnection(conn));

await runTests();
sut.close();

async function runTests() {
    const orch = createOrchestrator();
    const suite = createExampleSuite(orch);

    const testResult = await suite.test();
    reportResult(testResult);
}

function createOrchestrator() {
    const senders = new Senders();
    const orch = new Orchestrator<Message>(senders, 3000);

    senders.addSender("EM1", new ClientEmulator("EM1", sutHost, sutPort, orch));
    senders.addSender("EM2", new ClientEmulator("EM2", sutHost, sutPort, orch));
    return orch;
}
*/

demoExpectationFramework();