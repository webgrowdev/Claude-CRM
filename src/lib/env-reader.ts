import fs from 'fs'
import path from 'path'

let _loadedEnvPath: string | null = null

/**
 * Reads a specific environment variable from multiple possible file locations.
 * Searches in order of preference and returns the first value found.
 * 
 * @param key - The environment variable key to search for (e.g., 'SUPABASE_SERVICE_ROLE_KEY')
 * @returns The value of the environment variable, or undefined if not found
 */
export function readEnvFileValue(key: string): string | undefined {
  const possiblePaths = [
    // Hostinger paths - outside public_html (preferred for security)
    '/home/u246625160/domains/growicrm.site/env.server',
    '/home/u246625160/domains/growicrm.site/env',
    // Relative to current working directory
    path.join(process.cwd(), '..', 'env.server'),
    path.join(process.cwd(), '..', 'env'),
    // Standard Next.js env files
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ]

  for (const filePath of possiblePaths) {
    try {
      const txt = fs.readFileSync(filePath, 'utf8')
      const line = txt.split('\n').find(l => l.trim().startsWith(`${key}=`))
      
      if (line) {
        let value = line.split('=').slice(1).join('=').trim()
        
        // Handle quoted values (remove surrounding quotes)
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // Log only once when successfully loading from a file
        if (!_loadedEnvPath) {
          _loadedEnvPath = filePath
          console.log(`[env-reader] Successfully loaded environment variables from: ${filePath}`)
        }
        
        return value
      }
    } catch {
      // File doesn't exist or can't be read, continue to next path
      continue
    }
  }

  return undefined
}

/**
 * Reads SUPABASE_SERVICE_ROLE_KEY from file system.
 * This is a convenience wrapper around readEnvFileValue.
 */
export function readEnvFileKey(): string | undefined {
  return readEnvFileValue('SUPABASE_SERVICE_ROLE_KEY')
}
