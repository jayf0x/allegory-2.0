import { atom } from 'jotai';

export const isDevelopmentAtom = atom(import.meta.env.DEV);
