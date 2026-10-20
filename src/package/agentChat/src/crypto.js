import JSEncrypt from 'jsencrypt';
import CryptoJS from 'crypto-js';

// 传输加密：从 agent 取公钥 → AES-256-CBC 加密 config → RSA 加密 AES 密钥。
// 让抓包 / DevTools 看不到 config 明文（含数据库密码、API Key）。
// 注意：只保护"传输"；密钥若还写在前端代码里，看源码仍可见。

const pubKeyCache = new Map(); // base -> PEM

async function fetchPublicKey(base, force) {
  if (!force && pubKeyCache.has(base)) return pubKeyCache.get(base);
  const res = await fetch(`${base}/handshake`, { method: 'GET' });
  if (!res.ok) throw new Error(`handshake HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !data.publicKey) throw new Error('handshake 缺少 publicKey');
  pubKeyCache.set(base, data.publicKey);
  return data.publicKey;
}

/**
 * 把 config 加密成 { key, iv, data }。
 * @param {object} config  形如 { db, llm, limits }
 * @param {string} base    agent 地址（用于取公钥）
 */
export async function encryptConfig(config, base, force) {
  const json = JSON.stringify(config);

  // 随机 AES-256 密钥 + 16 字节 IV
  const aesKey = CryptoJS.lib.WordArray.random(32);
  const iv = CryptoJS.lib.WordArray.random(16);

  const data = CryptoJS.AES.encrypt(json, aesKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).ciphertext.toString(CryptoJS.enc.Base64);

  const aesKeyB64 = aesKey.toString(CryptoJS.enc.Base64);

  const rsaEncrypt = (pem) => {
    const rsa = new JSEncrypt();
    rsa.setPublicKey(pem);
    return rsa.encrypt(aesKeyB64);
  };

  // 公钥可能因 agent 重启而失效：force=true 时强制重取，加密失败再兜底重取一次
  let encKey = rsaEncrypt(await fetchPublicKey(base, !!force));
  if (!encKey) {
    encKey = rsaEncrypt(await fetchPublicKey(base, true));
  }
  if (!encKey) throw new Error('RSA 加密失败');

  return { key: encKey, iv: iv.toString(CryptoJS.enc.Base64), data };
}
