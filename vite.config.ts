import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files and the process environment.
  // The third parameter `''` loads all env vars, not just those prefixed with VITE_.
  // Casting process to any to resolve TypeScript error regarding cwd() in some environments.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    // The 'define' option allows us to replace global variables at build time.
    // This is crucial for making server-side environment variables (like API keys)
    // available to the client-side code in a secure way for deployments on platforms like Vercel.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
})