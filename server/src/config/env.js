import "dotenv/config"

export const env = {
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL: process.env.DATABASE_SSL === "true",
  
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  
  COOKIE_SECURE: (process.env.COOKIE_SECURE || "false") === "true",
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || "lax",
  
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || "menu-images",
}