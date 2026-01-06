import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' instead of process.cwd() avoids TS error regarding missing 'cwd' on Process type
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // This ensures your existing code using process.env.REACT_APP_... works
      'process.env': env
    },
  };
});