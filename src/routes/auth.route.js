import express from 'express';
const router = express.Router();
import { signUp, signIn, signOut } from '#controllers/auth.controller.js';

router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/sign-out', signOut);

export default router;
