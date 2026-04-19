// passphraseUtil.ts
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export default function generateMnemonicAndKey() {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate('hex');
  // 生成压缩公钥（33字节，以02/03开头）
  const publicKey = keyPair.getPublic(true, 'hex'); // true 表示压缩格式
  // address 与 publicKey 相同（前端使用公钥作为地址）
  return { privateKey, publicKey, address: publicKey };
}