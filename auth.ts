import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function getUser(soHieu: string) {
    try {
        const user = await prisma.user.findUnique({ where: { soHieu } });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ soHieu: z.string(), password: z.string().min(1) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { soHieu, password } = parsedCredentials.data;
                    const user = await getUser(soHieu);
                    if (!user) return null;

                    // WARNING: Passwords in CSV are currently plain text
                    // For production, we must migrate to hashed passwords.
                    // Check if password matches plain text OR hashed (for future proofing)

                    let passwordsMatch = false;

                    // Try plain text comparison first (Legacy CSV data)
                    if (password === user.password) {
                        passwordsMatch = true;
                    }
                    // If not match, try bcrypt compare (if we start hashing later)
                    else if (user.password.startsWith('$2')) {
                        passwordsMatch = await bcrypt.compare(password, user.password);
                    }

                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.fullName,
                            email: user.email,
                            image: user.avatar,
                            role: user.role,
                            soHieu: user.soHieu,
                            fullName: user.fullName,
                            groupIds: user.groupIds,
                            position: user.position,
                            permissions: (user as any).permissions,
                        };
                    }
                }
                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
