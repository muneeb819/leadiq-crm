import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'Email and password required', 400);
    const user = await authService.findUserByEmail(email);
    if (!user) return sendError(res, 'Invalid credentials', 401);
    const valid = await authService.comparePassword(password, user.passwordHash);
    if (!valid) return sendError(res, 'Invalid credentials', 401);
    const tokens = authService.generateTokens({ id: user.id, email: user.email, role: user.role });
    sendSuccess(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens });
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return sendError(res, 'All fields required', 400);
    if (password.length < 8) return sendError(res, 'Password must be at least 8 characters', 400);
    const existing = await authService.findUserByEmail(email);
    if (existing) return sendError(res, 'Email already registered', 409);
    const user = await authService.createUser(email, password, name);
    const tokens = authService.generateTokens({ id: user.id, email: user.email, role: user.role });
    sendSuccess(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens }, 201);
  } catch (err: any) {
    sendError(res, err.message);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);
    const decoded = authService.verifyRefreshToken(refreshToken);
    const user = await authService.findUserById(decoded.id);
    if (!user) return sendError(res, 'User not found', 404);
    const tokens = authService.generateTokens({ id: user.id, email: user.email, role: user.role });
    sendSuccess(res, tokens);
  } catch {
    sendError(res, 'Invalid refresh token', 401);
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.findUserById(req.user!.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err: any) {
    sendError(res, err.message);
  }
};
