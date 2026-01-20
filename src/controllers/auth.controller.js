import logger from '#config/logger.js';
import { signUpSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import {cookies} from '#utils/cookies.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import {jwttoken} from '#utils/jwt.js';

export const signUp = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: formatValidationError(validationResult.error) });
    }
    const {name, email, role, password} = validationResult.data;

    const user = await createUser(name,email,password,role);
    const token = jwttoken.sign({id: user.id, email: user.email, role: user.role});
    cookies.setCookie(res,'token',token);
    logger.info(`User registered successfuly: ${email} `);
    res.status(201).json({message:'User registered', user: {id:user.id,name:user.name,email:user.email,role:user.role}});
    // Proceed with user registration
  } catch (e) {
    logger.error('Sign up error',e);
    if(e.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(e);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: formatValidationError(validationResult.error) });
    }
    const {email, password} = validationResult.data;

    const user = await authenticateUser(email, password);
    const token = jwttoken.sign({id: user.id, email: user.email, role: user.role});
    cookies.setCookie(res, 'token', token);
    logger.info(`User signed in successfully: ${email}`);
    res.status(200).json({message: 'User signed in', user: {id: user.id, name: user.name, email: user.email, role: user.role}});
  } catch (e) {
    logger.error('Sign in error', e);
    if (e.message === 'User not found' || e.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    next(e);
  }
};

export const signOut = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');
    logger.info('User signed out successfully');
    res.status(200).json({message: 'User signed out successfully'});
  } catch (e) {
    logger.error('Sign out error', e);
    next(e);
  }
};
