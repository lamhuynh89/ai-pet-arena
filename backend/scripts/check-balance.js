#!/usr/bin/env node
/**
 * Quick balance + ledger check for 0G Compute
 * Usage:
 *   node scripts/check-balance.js
 */

require('dotenv').config();
const { createZGComputeNetworkBroker } = require('@0gfoundation/0g-compute-ts-sdk');
const { ethers } = require('ethers');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('No PRIVATE_KEY');
    process.exit(1);
  }

  const rpc = 'https://evmrpc-testnet.0g.ai';
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  const native = await provider.getBalance(wallet.address);
  console.log('Address:', wallet.address);
  console.log('Native OG:', ethers.formatEther(native));

  try {
    const broker = await createZGComputeNetworkBroker(wallet);
    const L = broker.ledger;
    try {
      const ledger = await L.getLedger();
      console.log('Ledger:', ledger);
    } catch (e) {
      console.log('Ledger status:', e.message);
    }
    try {
      const provs = await L.getProvidersWithBalance('inference');
      console.log('Providers w/ balance (inference):', provs);
    } catch (e) {
      console.log('Provider balances:', e.message);
    }
  } catch (e) {
    console.log('Broker/ledger err:', e.message);
  }

  console.log('Faucet: https://faucet.0g.ai (need 3+ OG for addLedger)');
}

main().catch(e => { console.error(e.message); process.exit(1); });
