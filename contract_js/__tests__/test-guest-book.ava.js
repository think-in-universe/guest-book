import { Worker } from 'near-workspaces';
import {readFile} from 'fs/promises'
import test from 'ava';

// TODO: make this function part of the npm package when it is available
function encodeCall(contract, method, args) {
    return Buffer.concat([Buffer.from(contract), Buffer.from([0]), Buffer.from(method), Buffer.from([0]), Buffer.from(JSON.stringify(args))])
}

test.beforeEach(async t => {
    // Init the worker and start a Sandbox server
    const worker = await Worker.init();

    // Prepare sandbox for tests, create accounts, deploy contracts, etx.
    const root = worker.rootAccount;

    // Deploy the jsvm contract.
    const jsvm = await root.createAndDeploy(
        root.getSubAccount('jsvm').accountId,
        './node_modules/near-sdk-js/res/jsvm.wasm',
    );

    // Deploy guest book contract
    const guestBookContract = await root.createSubAccount('guest-book');
    let guestBookContractBase64 = (await readFile('build/contract.base64')).toString();
    await guestBookContract.call(jsvm, 'deploy_js_contract', Buffer.from(guestBookContractBase64, 'base64'), {attachedDeposit: '400000000000000000000000'});
    await guestBookContract.call(jsvm, 'call_js_contract', encodeCall(guestBookContract.accountId, 'init', []), {attachedDeposit: '400000000000000000000000'});

    // Create test accounts
    const ali = await root.createSubAccount('ali');
    const bob = await root.createSubAccount('bob');

    // Save state for test runs, it is unique for each test
    t.context.worker = worker;
    t.context.accounts = {
        root,
        jsvm,
        guestBookContract,
        ali,
        bob,
    };
});

test.afterEach(async t => {
    await t.context.worker.tearDown().catch(error => {
        console.log('Failed tear down the worker:', error);
    });
});

test('No messages at the beginning', async t => {
    const { jsvm, guestBookContract } = t.context.accounts;
    const result = await jsvm.view('view_js_contract', encodeCall(guestBookContract.accountId, 'getMessages', []));
    t.deepEqual(result, []);
});

test('Can add message by one account', async t => {
    const { ali, jsvm, guestBookContract } = t.context.accounts;
    await ali.call(jsvm, 'call_js_contract', encodeCall(guestBookContract.accountId, 'addMessage', ['hello']), {attachedDeposit: '100000000000000000000000'});
    const result = await jsvm.view('view_js_contract', encodeCall(guestBookContract.accountId, 'getMessages', []));
    t.deepEqual(
        result,
        [JSON.stringify({
            premium: false,
            text: 'hello',
            sender: 'ali.test.near',
        })]
    );
});
