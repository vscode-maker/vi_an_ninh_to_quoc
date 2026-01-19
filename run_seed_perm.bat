@echo off
call npx ts-node --compiler-options "{\"module\":\"commonjs\"}" scripts/seed-permissions.ts
