// Simple in-memory auth for Web3 Pet ownership flow (MVP demo)
// Username required. Password optional (demo allows username-only login if no pass).
// Optional walletAddress for Web3 flavor.
// Tokens for stateless session. Owned pets tracked by rootHash.

const crypto = require('crypto');

let users = new Map(); // username -> user record
let tokens = new Map(); // token -> {username, expiresAt}

function generateToken() {
  return 'tok_' + crypto.randomBytes(18).toString('hex');
}

function register(username, password = null, walletAddress = null) {
  if (!username || typeof username !== 'string') throw new Error('username required');
  username = username.trim().toLowerCase();
  if (username.length < 3 || username.length > 20) throw new Error('username 3-20 chars');
  if (!/^[a-z0-9_]+$/.test(username)) throw new Error('username: letters, numbers, _ only');

  if (users.has(username)) throw new Error('username already taken');

  const user = {
    username,
    password: password ? String(password) : null, // plain text demo only
    wallet: walletAddress ? String(walletAddress).trim() : null,
    ownedPets: new Set(),
    createdAt: new Date().toISOString()
  };
  users.set(username, user);
  return { success: true, username, hasPassword: !!user.password };
}

function login(username, password = null) {
  if (!username) throw new Error('username required');
  username = username.trim().toLowerCase();

  const user = users.get(username);
  if (!user) throw new Error('user not found');

  if (user.password) {
    if (!password || password !== user.password) {
      throw new Error('invalid password');
    }
  }
  // if no password set on register, login with username only is allowed (demo)

  const token = generateToken();
  const expiresAt = Date.now() + (1000 * 60 * 60 * 24 * 30); // 30 days
  tokens.set(token, { username, createdAt: Date.now(), expiresAt });

  return {
    success: true,
    token,
    user: {
      username: user.username,
      wallet: user.wallet,
      petCount: user.ownedPets.size
    }
  };
}

function getUserFromToken(token) {
  if (!token) return null;
  const tinfo = tokens.get(token);
  if (!tinfo) return null;
  if (Date.now() > tinfo.expiresAt) {
    tokens.delete(token);
    return null;
  }
  return users.get(tinfo.username) || null;
}

function verifyToken(token) {
  return getUserFromToken(token);
}

function claimPet(token, rootHash) {
  if (!rootHash || typeof rootHash !== 'string') throw new Error('rootHash required');
  if (!rootHash.startsWith('0x') || rootHash.length < 10) throw new Error('invalid rootHash format');

  const user = getUserFromToken(token);
  if (!user) throw new Error('invalid or expired token. Login first');

  user.ownedPets.add(rootHash);

  return {
    success: true,
    message: 'Pet claimed',
    rootHash,
    totalOwned: user.ownedPets.size
  };
}

function getMyPets(token) {
  const user = getUserFromToken(token);
  if (!user) throw new Error('invalid or expired token');

  return Array.from(user.ownedPets);
}

function isOwner(token, rootHash) {
  const user = getUserFromToken(token);
  if (!user || !rootHash) return false;
  return user.ownedPets.has(rootHash);
}

function getUserInfo(token) {
  const user = getUserFromToken(token);
  if (!user) return null;
  return {
    username: user.username,
    wallet: user.wallet,
    ownedPets: Array.from(user.ownedPets),
    createdAt: user.createdAt
  };
}

// For debug / testing only (dev)
function _debugGetUsers() { return Array.from(users.keys()); }
function _debugClear() { users.clear(); tokens.clear(); }

module.exports = {
  register,
  login,
  verifyToken,
  claimPet,
  getMyPets,
  isOwner,
  getUserInfo,
  getUserFromToken,
  _debugGetUsers,
  _debugClear
};
