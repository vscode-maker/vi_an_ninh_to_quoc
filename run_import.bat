@echo off
call npx ts-node --compiler-options "{\"module\":\"commonjs\"}" scripts/import-cong-dan.ts
