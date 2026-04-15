import { Router } from "express";
import {
  createUser,
  getCurrentUser,
  getUserById,
  loginUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = Router();

/**
 * POST /api/users/signup
 * Create a new user account
 */
router.post("/signup", createUser);

/**
 * POST /api/users/login
 * Log in an existing user
 */
router.post("/login", loginUser);

/**
 * GET /api/users/me
 * Get current user from Authorization: Bearer <token>
 */
router.get("/me", getCurrentUser);

/**
 * POST /api/users
 * Create a new user
 */
router.post("/", createUser);

/**
 * GET /api/users/:id
 * Get a user by ID
 */
router.get("/:id", getUserById);

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put("/:id", updateUser);

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete("/:id", deleteUser);

export default router;
