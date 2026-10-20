const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const SITE_URL = new URL(
  process.env.SITE_URL || (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000")
);

export const SOURCE_USER_AGENT = "Civica-Web/1.0 (+https://github.com/eloooong/civica-web)";
