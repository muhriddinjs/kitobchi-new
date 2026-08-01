// Defaults so `npm run test:e2e` works against the docker-compose Postgres
// without a .env file. Anything already set (CI, a real .env) wins.
//
// Redis and S3 values are deliberately fake: the suites mint JWTs directly
// rather than going through the SMS/OTP flow, so nothing here ever reaches
// Upstash or S3. Only DATABASE_URL points at something real.
const defaults: Record<string, string> = {
  DATABASE_URL: 'postgresql://kitobchi:kitobchi@localhost:5432/kitobchi',
  UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test_token',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'kitobchi-listings',
  S3_ACCESS_KEY: 'test',
  S3_SECRET_KEY: 'test',
  S3_PUBLIC_URL: 'http://localhost:9000/kitobchi-listings',
  JWT_ACCESS_SECRET: 'test_access_secret',
  JWT_REFRESH_SECRET: 'test_refresh_secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '30d',
  OTP_TTL_SECONDS: '120',
  OTP_RESEND_COOLDOWN_SECONDS: '60',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
