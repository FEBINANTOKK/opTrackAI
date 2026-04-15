import crypto from "crypto";
import { promisify } from "util";
import { Request, Response } from "express";
import User from "../models/User.js";
import Preference from "../models/Preference.js";

const scryptAsync = promisify(crypto.scrypt);

type PublicUser = {
  id: string;
  username: string;
  email: string;
};

const toPublicUser = (user: {
  _id: { toString(): string };
  username: string;
  email: string;
}): PublicUser => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
});

const normalizeCredential = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const createPasswordHash = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
};

const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
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

const createAuthToken = (): string => crypto.randomBytes(32).toString("hex");

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = normalizeCredential(req.body.username);
    const email = normalizeCredential(req.body.email).toLowerCase();
    const password = normalizeCredential(req.body.password);

    if (!username || !email || password.length < 6) {
      res.status(400).json({
        error: "Username, email, and a password with at least 6 characters are required.",
      });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(409).json({
        error: existingUser.email === email ? "Email is already registered." : "Username is already taken.",
      });
      return;
    }

    const passwordHash = await createPasswordHash(password);
    const authToken = createAuthToken();

    const user = await User.create({
      username,
      name: username,
      email,
      passwordHash,
      authToken,
    });

    res.status(201).json({
      token: authToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ error: "Unable to create user right now." });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = normalizeCredential(req.body.username);
    const password = normalizeCredential(req.body.password);

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    if (!user) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const authToken = createAuthToken();
    user.authToken = authToken;
    await user.save();

    const preference = await Preference.findOne({ userId: user._id });
    
    res.status(200).json({
      token: authToken,
      user: toPublicUser(user),
      preference: preference || null,
    });
  } catch (error) {
    console.error("Failed to log in user:", error);
    res.status(500).json({ error: "Unable to log in right now." });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: "Authorization: Bearer <token> header is required." });
      return;
    }

    const user = await User.findOne({ authToken: token });
    if (!user) {
      res.status(401).json({ error: "Invalid or expired token." });
      return;
    }

    const preference = await Preference.findOne({ userId: user._id });
    
    res.status(200).json({ 
      user: toPublicUser(user),
      preference: preference || null
    });
  } catch (error) {
    console.error("Failed to get current user:", error);
    res.status(500).json({ error: "Unable to fetch the current user." });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Failed to get user by id:", error);
    res.status(500).json({ error: "Unable to fetch user." });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {};

    if (typeof req.body.name === "string") {
      updates.name = req.body.name.trim();
    }
    if (typeof req.body.location === "string") {
      updates.location = req.body.location.trim();
    }
    if (Array.isArray(req.body.skills)) {
      updates.skills = req.body.skills.filter((skill: unknown) => typeof skill === "string");
    }
    if (Array.isArray(req.body.preferredTypes)) {
      updates.preferredTypes = req.body.preferredTypes.filter((type: unknown) => typeof type === "string");
    }
    if (typeof req.body.experienceLevel === "string") {
      updates.experienceLevel = req.body.experienceLevel;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Failed to update user:", error);
    res.status(500).json({ error: "Unable to update user." });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Unable to delete user." });
  }
};
