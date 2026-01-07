import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role: string
            /** The user's unique identifier (Badge Number). */
            soHieu: string
            /** The user's full name. */
            fullName: string
            /** The user's group IDs. */
            groupIds: string | null
            /** The user's permissions */
            permissions: string[]
            /** The user's position */
            position: string | null
            /** The user's image */
            image: string | null
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        soHieu: string
        fullName: string
        groupIds: string | null
        permissions: string[]
        position: string | null
        // Image is usually already in DefaultUser, but strict checking might need it
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        role: string
        soHieu: string
        fullName: string
        groupIds: string | null
        permissions: string[]
        position: string | null
        image: string | null
    }
}
