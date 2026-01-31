/**
 * Phase 2.3 / Phase 4.3: Verify mainnet contract deployment.
 * Calls Hiro mainnet API to test read-only functions.
 * Run: node scripts/verify-mainnet-deployment.mjs
 *
 * Hiro v2 call-read expects arguments as hex-encoded Clarity values (serialized).
 */

import pkg from '@stacks/transactions';
const { cvToHex, stringAsciiCV } = pkg;

const MAINNET_API = 'https://api.hiro.so';
const DEPLOYER = 'SP22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRB8X907KX';
const CONTRACT = 'badge2048';

async function callReadOnly(functionName, args = []) {
  const url = `${MAINNET_API}/v2/contracts/call-read/${DEPLOYER}/${CONTRACT}/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: DEPLOYER, arguments: args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('Phase 2.3: Verifying mainnet contract deployment\n');
  console.log(`Contract: ${DEPLOYER}.${CONTRACT}`);
  console.log(`API: ${MAINNET_API}\n`);

  let ok = true;

  // 1. get-last-token-id
  try {
    const data = await callReadOnly('get-last-token-id', []);
    const result = data.result ?? data;
    const value = result?.value ?? result;
    console.log('get-last-token-id:', JSON.stringify(data, null, 2));
    console.log('-> Interpreted value:', value);
    console.log('-> OK\n');
  } catch (e) {
    console.error('get-last-token-id FAILED:', e.message);
    ok = false;
  }

  // 2. get-badge-mint-count (bronze) — arguments must be hex-encoded Clarity values
  try {
    const bronzeHex = cvToHex(stringAsciiCV('bronze'));
    const data = await callReadOnly('get-badge-mint-count', [bronzeHex]);
    const result = data.result ?? data;
    const value = result?.value ?? result;
    console.log('get-badge-mint-count("bronze"):', JSON.stringify(data, null, 2));
    console.log('-> Interpreted value:', value);
    console.log('-> OK\n');
  } catch (e) {
    console.error('get-badge-mint-count FAILED:', e.message);
    ok = false;
  }

  if (ok) {
    console.log('Verification passed. Contract is live and responsive on mainnet.');
  } else {
    console.log('Some checks failed. See above.');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
