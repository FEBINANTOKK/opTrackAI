import bcrypt from "bcrypt";
import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);
const BCRYPT_ROUNDS = 10;

const isBcryptHash = (value: string): boolean => value.startsWith("$2");

const verifyLegacyScryptPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedKey);
};

export const createPasswordHash = async (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  if (!passwordHash) {
    return false;
  }

  if (isBcryptHash(passwordHash)) {
    return bcrypt.compare(password, passwordHash);
  }

  return verifyLegacyScryptPassword(password, passwordHash);
};
