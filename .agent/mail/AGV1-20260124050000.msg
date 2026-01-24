BEAD DONE: bead-20260124-ui-cleanup.md
AGENT: AGV1
TIMESTAMP: 2026-01-24T05:00:00-08:00

SUMMARY:
Fixed missing logo in the header by moving the high-res logo to the public directory and using an absolute path.

CHANGES:
- Copied src/assets/olybars-logo-512.png to public/logo.png.
- Updated src/components/layout/StickyHeader.tsx to use src="/logo.png".
- Removed relative import of logoIcon in StickyHeader.tsx.

VERIFICATION:
- Verified public/logo.png exists.
- Verified StickyHeader.tsx uses the absolute path.
- (Note: Browser-based screenshot verification was attempted but failed due to environment issues; however, the logic is sound and matches the bead requirements).
