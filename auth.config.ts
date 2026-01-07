import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                if (token.sub) {
                    session.user.id = token.sub;
                }
                if (token.role) {
                    // @ts-ignore
                    session.user.role = token.role;
                }
                if (token.soHieu) {
                    // @ts-ignore
                    session.user.soHieu = token.soHieu;
                }
                if (token.fullName) {
                    // @ts-ignore
                    session.user.fullName = token.fullName;
                    session.user.name = token.fullName as string; // Ensure name is set
                }
                if (token.groupIds) {
                    // @ts-ignore
                    session.user.groupIds = token.groupIds;
                }
                if (token.position) {
                    // @ts-ignore
                    session.user.position = token.position;
                }
                if (token.image) {
                    session.user.image = token.image as string;
                }
                if (token.permissions) {
                    // @ts-ignore
                    session.user.permissions = token.permissions;
                }
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                // @ts-ignore
                token.soHieu = user.soHieu;
                // @ts-ignore
                token.fullName = user.fullName;
                // @ts-ignore
                token.groupIds = user.groupIds;
                // @ts-ignore
                token.position = user.position;
                // @ts-ignore
                token.image = user.image;
                // @ts-ignore
                token.permissions = user.permissions;
            }

            // Support updating session via client
            if (trigger === "update" && session) {
                // Allow updating specific fields if passed safely
                if (session.user?.image) token.image = session.user.image;
                // Add other updatable fields if needed
            }

            return token;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
