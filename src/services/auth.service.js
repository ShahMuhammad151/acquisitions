import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error(`Invalid password ${e} `);
    throw e;
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    logger.error(`Error comparing password: ${e}`);
    throw e;
  }
};
export const createUser = async (name, email, password,role='user') => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email,email)).limit(1);
    if (existingUser.length > 0) throw new Error('User already exists');
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role
    }).returning({id:users.id,name:users.name,email:users.email,role:users.role, created_at:users.created_at});
    logger.info(`User created: ${email} `);
    return newUser;
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    throw error;
  }
};

export const authenticateUser = async (email, password) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    logger.info(`User authenticated: ${email}`);
    return {id: user.id, name: user.name, email: user.email, role: user.role};
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    throw error;
  }
};
