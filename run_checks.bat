@echo off
call npx ts-node --compiler-options "{\"module\":\"commonjs\"}" scripts/get_test_users.ts
echo ---------------------------------------------------
call npx ts-node --compiler-options "{\"module\":\"commonjs\"}" scripts/verify-drive.ts
