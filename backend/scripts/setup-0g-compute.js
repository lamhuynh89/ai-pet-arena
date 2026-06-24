#!/usr/bin/env node
/**
 * 0G Compute Setup Script (Real Mode)
 * Fixes: "Sub-account not found" / Account does not exist
 *
 * Steps:
 * 1. addLedger (create main account, MIN 3 OG)
 * 2. depositFund (add more if needed)
 * 3. list providers
 * 4. transfer-fund to provider sub-account (inference)
 * 5. acknowledge provider
 *
 * Usage (after funding wallet with >=3 OG from faucet):
 *   cd backend
 *   node scripts/setup-0g-compute.js
 *
 * Or with env:
 *   PRIVATE_KEY=0x... node scripts/setup-0g-compute.js
 *
 * Windows Server 2016 compatible (pure node + ethers + sdk)
 */

require('dotenv').config();
const { createZGComputeNetworkBroker } = require('@0gfoundation/0g-compute-ts-sdk');
const { ethers } = require('ethers');

const MIN_LEDGER = 3;           // min to create account (required)
const DEPOSIT_AMOUNT = 1;       // extra deposit
const TRANSFER_AMOUNT = 1;      // to provider sub-account (min recommended 1 OG per SDK)

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const network = process.env.OG_NETWORK || 'testnet';

  if (!privateKey || privateKey.length < 20) {
    console.error('ERROR: PRIVATE_KEY required in .env or env');
    console.error('Get testnet OG: https://faucet.0g.ai  (need >=3 OG for ledger)');
    process.exit(1);
  }

  const rpcUrl = network === 'testnet' 
    ? 'https://evmrpc-testnet.0g.ai' 
    : 'https://evmrpc.0g.ai';

  console.log('=== 0G Compute Setup ===');
  console.log('Network:', network);
  console.log('RPC:', rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('Wallet:', wallet.address);

  const bal = await provider.getBalance(wallet.address);
  console.log('Wallet balance OG:', ethers.formatEther(bal));

  if (parseFloat(ethers.formatEther(bal)) < MIN_LEDGER) {
    console.warn('WARNING: Low balance. Need >= 3 OG for addLedger.');
    console.warn('Visit: https://faucet.0g.ai or https://cloud.google.com/application/web3/faucet/0g/galileo');
  }

  let broker;
  try {
    broker = await createZGComputeNetworkBroker(wallet);
    console.log('Broker ready');
  } catch (e) {
    console.error('Broker fail:', e.message);
    process.exit(1);
  }

  const L = broker.ledger;
  const I = broker.inference;

  // 1. Create ledger / add-account (sub-account system starts here)
  console.log('\n[1] Ensure main ledger (addLedger if missing)...');
  try {
    await L.getLedger();
    console.log('Ledger already exists');
  } catch (e) {
    if (e.message.includes('Account does not exist') || e.message.includes('add-account')) {
      console.log('Creating ledger with', MIN_LEDGER, 'OG (min required)...');
      try {
        await L.addLedger(MIN_LEDGER);
        console.log('addLedger OK (account created)');
      } catch (ee) {
        console.error('addLedger FAIL:', ee.message);
        console.error('Need more OG in wallet. Faucet: https://faucet.0g.ai');
        process.exit(1);
      }
    } else {
      console.error('getLedger unexpected:', e.message);
    }
  }

  // 2. Deposit extra
  console.log('\n[2] Deposit extra funds to main account...');
  try {
    await L.depositFund(DEPOSIT_AMOUNT);
    console.log('depositFund', DEPOSIT_AMOUNT, 'OG OK');
  } catch (e) {
    console.warn('depositFund warn:', e.message);
  }

  // 3. List providers
  console.log('\n[3] List inference providers...');
  let services = [];
  try {
    services = await I.listService();
    console.log('Found', services.length, 'services');
  } catch (e) {
    console.warn('listService fail:', e.message);
  }

  if (services.length === 0) {
    console.error('No providers. Wait or check explorer: https://chainscan-galileo.0g.ai');
    process.exit(1);
  }

  // Prefer inference/chat providers
  const target = services.find(s => (s.model || '').toLowerCase().includes('qwen') || (s.name || '').includes('chat')) || services[0];
  const providerAddr = target.provider || target[0] || target.address;
  console.log('Target provider:', providerAddr);
  if (target.model) console.log('Model:', target.model);

  // 4. Transfer to sub-account (this creates the provider sub-account)
  console.log('\n[4] Transfer to provider sub-account...');
  try {
    // Amount must be integer OG (SDK expects whole number or BigInt internally)
    await L.transferFund(providerAddr, 'inference', TRANSFER_AMOUNT);
    console.log('transferFund', TRANSFER_AMOUNT, 'OG to', providerAddr, 'OK');
  } catch (e) {
    console.warn('transferFund warn (may already funded):', e.message);
  }

  // 5. Acknowledge provider (required before inference headers)
  console.log('\n[5] Acknowledge provider signer...');
  try {
    await I.acknowledgeProviderSigner(providerAddr);
    console.log('acknowledgeProviderSigner OK');
  } catch (e) {
    console.warn('acknowledge warn:', e.message);
  }

  // 6. Verify sub-account
  console.log('\n[6] Verify sub-account balance...');
  try {
    const provs = await L.getProvidersWithBalance('inference');
    console.log('Providers with balance (inference):', provs);
  } catch (e) {
    console.log('getProvidersWithBalance:', e.message);
  }

  console.log('\n=== SETUP COMPLETE ===');
  console.log('Now set AI_MODE=0g and run:');
  console.log('  node smoke-0g.js');
  console.log('Or start server: npm run dev');
  console.log('Sub-account should be funded for provider.');
}

main().catch(err => {
  console.error('SETUP FAILED:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0,6).join('\n'));
  process.exit(1);
});
