import { useAtom } from 'jotai';
import { isDevelopmentAtom } from '@/store/general';

export const useApp = () => {
  const [isDevMode, setIsDevMode] = useAtom(isDevelopmentAtom);
  return { isDevMode, setIsDevMode };
};
