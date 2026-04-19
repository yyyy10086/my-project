// src/utils/eccUtil.ts
import CryptoJS from "crypto-js";
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

const P = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
const N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
const A = 0n;

const G = {
  x: BigInt("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"),
  y: BigInt("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8"),
};

interface ECPoint {
  x: bigint;
  y: bigint;
}

/**
 * 资源共享交易对象接口
 * 【改造说明】新增 resourceId 和 recordType 字段
 */
export interface ResourceTransaction {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  timestamp: string;
  resourceId: number | null;
  recordType: string;
}

// 旧版兼容接口
export interface Transaction {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  timestamp: string;
}

function modPow(base: bigint, exp: bigint, p: bigint): bigint {
  let result = 1n;
  let b = base % p;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * b) % p;
    b = (b * b) % p;
    exp = exp / 2n;
  }
  return result;
}

function modInverse(a: bigint, p: bigint): bigint {
  return modPow(a, p - 2n, p);
}

function modMul(a: bigint, b: bigint, p: bigint): bigint {
  return (a * b) % p;
}

function modAdd(a: bigint, b: bigint, p: bigint): bigint {
  return (a + b) % p;
}

function modSub(a: bigint, b: bigint, p: bigint): bigint {
  return (a - b + p) % p;
}

function pointAdd(p1: ECPoint, p2: ECPoint): ECPoint {
  if (p1.x === 0n && p1.y === 0n) return p2;
  if (p2.x === 0n && p2.y === 0n) return p1;
  if (p1.x === p2.x && p1.y !== p2.y) return { x: 0n, y: 0n };

  let m: bigint;
  if (p1.x === p2.x && p1.y === p2.y) {
    m = modMul(3n * p1.x * p1.x + A, modInverse(2n * p1.y, P), P);
  } else {
    m = modMul(p2.y - p1.y, modInverse(p2.x - p1.x, P), P);
  }

  const x3 = modSub(modMul(m, m, P), modAdd(p1.x, p2.x, P), P);
  const y3 = modSub(modMul(m, modSub(p1.x, x3, P), P), p1.y, P);
  return { x: x3, y: y3 };
}

function pointMultiply(k: bigint, point: ECPoint): ECPoint {
  let result: ECPoint = { x: 0n, y: 0n };
  let addend: ECPoint = point;
  while (k > 0n) {
    if (k % 2n === 1n) result = pointAdd(result, addend);
    addend = pointAdd(addend, addend);
    k = k / 2n;
  }
  return result;
}

/**
 * 签名资源共享交易
 * 
 * 【关键】消息格式必须和后端 ECDSAUtil.buildResourceMessage() 完全一致！
 * 后端格式：{"senderAddress":"x","recipientAddress":"x","amount":10,"timestamp":"x","resourceId":1,"recordType":"BORROW_REQUEST"}
 */
export function signResourceMessage(privateKeyHex: string, msg: ResourceTransaction): { r: string; s: string } {
  const privateKey = BigInt("0x" + privateKeyHex);

  // 构建与后端完全一致的 JSON 字符串
  const messageString = `{"senderAddress":"${msg.senderAddress}","recipientAddress":"${msg.recipientAddress}","amount":${msg.amount},"timestamp":"${msg.timestamp}","resourceId":${msg.resourceId},"recordType":"${msg.recordType}"}`;
  
  const hash = CryptoJS.SHA256(CryptoJS.SHA256(messageString)).toString();
  const z = BigInt("0x" + hash);

  console.log("签名消息:", messageString);
  console.log("双重SHA256:", hash);

  let r: bigint, s: bigint;
  do {
    const k = BigInt("0x" + CryptoJS.lib.WordArray.random(32).toString());
    const R = pointMultiply(k, G);
    r = R.x % N;
    const kInv = modInverse(k, N);
    s = modMul(kInv, modAdd(z, modMul(r, privateKey, N), N), N);
  } while (r === 0n || s === 0n);

  return {
    r: r.toString(16).padStart(64, '0'),
    s: s.toString(16).padStart(64, '0'),
  };
}

export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const key = ec.keyFromPrivate(privateKeyHex, 'hex');
  return key.getPublic(true, 'hex'); // 压缩公钥
}


/**
 * 旧版签名方法（保持兼容）
 */
export function signMessage(privateKeyHex: string, message: Transaction): { r: string; s: string } {
  const privateKey = BigInt("0x" + privateKeyHex);
  const messageString = JSON.stringify(message);
  const hash = CryptoJS.SHA256(CryptoJS.SHA256(messageString)).toString();
  const z = BigInt("0x" + hash);

  let r: bigint, s: bigint;
  do {
    const k = BigInt("0x" + CryptoJS.lib.WordArray.random(32).toString());
    const R = pointMultiply(k, G);
    r = R.x % N;
    const kInv = modInverse(k, N);
    s = modMul(kInv, modAdd(z, modMul(r, privateKey, N), N), N);
  } while (r === 0n || s === 0n);

  return {
    r: r.toString(16).padStart(64, '0'),
    s: s.toString(16).padStart(64, '0'),
  };
}