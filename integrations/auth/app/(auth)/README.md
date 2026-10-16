# Member auth pages (installed with the "auth" catalog entry)

The install commit adds `/login` and `/signup` pages here that call
`signIn("password", formData)` from `@convex-dev/auth/react`, matching the
Sortiri signup panel patterns, plus a `ConvexAuthProvider` wrap in the root
layout. They are generated per site from the catalog so they inherit the
site theme; this placeholder keeps the payload path reserved.
