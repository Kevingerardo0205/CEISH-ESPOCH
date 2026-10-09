/**
 * Fake environment variables for the e2e test suite.
 * These are clearly synthetic test-only values — NEVER real credentials.
 * They are set before NestJS modules are initialised so that requireEnv()
 * does not abort the test bootstrap.
 */

// AES-256 test key: 32 zero-bytes encoded in base64 (test-only, not a real key)
process.env.ENCRYPTION_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

// JWT test secrets (test-only, not real values)
process.env.JWT_SECRET = 'ceish-test-jwt-secret-value-for-unit-tests-only';
process.env.JWT_REFRESH_SECRET =
  'ceish-test-refresh-secret-value-for-unit-tests-only';

// S3 test credentials (test-only, not real values — prevents startup throw in e2e)
process.env.S3_ACCESS_KEY_ID = 'test-s3-access-key-id-fake';
process.env.S3_SECRET_ACCESS_KEY = 'test-s3-secret-access-key-fake';

// Default test database for all e2e suites — can be overridden by TEST_DB_NAME
process.env.DB_NAME = process.env.TEST_DB_NAME || 'ceish_test_db';
