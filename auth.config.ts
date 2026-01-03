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
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role;
                // @ts-ignore
                session.user.soHieu = token.soHieu;
                // @ts-ignore
                session.user.fullName = token.fullName;
                // @ts-ignore
                session.user.groupIds = token.groupIds;
                // @ts-ignore
                session.user.position = token.position;
            }
            return session;
        },
        async jwt({ token, user }) {
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
            }
            return token;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
