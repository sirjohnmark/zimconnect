// The homepage lives in src/app/(public)/page.tsx.
// This file re-exports it so both the route group and the root page
// resolve to the same component, avoiding duplicate-page build errors.
export { default } from "./(public)/page";
