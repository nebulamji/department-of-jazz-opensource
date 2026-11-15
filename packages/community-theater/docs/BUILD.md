# Theater technical build plan

## Discord
Categories: public (#welcome #lobby #world-feed #theater #credits), creative (#research #characters #scenes #screenplays), production (#storyboards #assets #render-queue #review), economy (#mint #roles #commissions #receipts), private (#editorial #agent-ops #budget). A future bot should ingest only opted-in channels/messages; no blanket surveillance. User contributions remain review-only until rights and publication are approved.

## Role NFT model
Audience (free), Archivist (research), Writer (scripts), Actor (character and performance proposals), Director (editorial approval and bounded zero-spend production), Producer (publication proposal). Roles are provisioned from a future mint/reveal manifest, verified ownership, signed wallet-to-Discord link, expiring token-role binding, and rechecked ownership for each privileged mutation. No financial or publishing authority follows merely from possessing an NFT.

## A2A and agent skills
The required message shape is `{worldId,workId,attempt,from,to,capability,inputDigest,budgetLimit,leaseUntil,artifactDigest,receiptId}`. Only approved, allowlisted `research.sources`, `world.propose`, `cinema.storyboard`, `cinema.render`, `cinema.check`, `cinema.publish` skills are admissible. Convex queue should enforce unique (worldId,workId,attempt), ack/lease/retry, signed worker identity and independent checker distinct from creator. Remote worker inputs are declarative manifests, not arbitrary shell commands or hidden API keys.

## Production architecture
Discord submissions -> scoped source receipts -> research packets -> typed graph nodes -> canon gate -> scene/shot manifest -> worker queue -> render -> independent QA -> curated screening. Reuse DoJ node/manifest contracts via separately permissioned adapter; use GitHub PRs for public canon promotion and artifact pointer receipts, not for bulk unlicensed user chat.

## Economy
One curated theater account premieres finished cinema. CC0 remixes only of works explicitly licensed CC0 by their rightful owners. Paid commissions and voluntary subscriptions before speculative token fees. A later role mint can fund production after approved issuance terms. No automatic treasury spending, promised dividends, royalty splits, NFT price support or token issuance.

## Acceptance probes
1. Prove new source from two consenting Discord identities, retaining credit and no default publication.
2. Prove verified mint role grants intended creative action and other roles deny it.
3. Approve proposal with source references and produce deterministic manifest.
4. Render real media, independently verify artifact hash/canon/format and require human release.
5. Transfer NFT, expire role evidence, deny future writes.
6. Duplicate Discord event and replay A2A messages; show only one durable action.
7. Prove exact payment or clearly say none occurred.

## Rollback
Stop Discord commands and worker dispatch; preserve ledger, revoke stale authorization and temporary credentials, and unpublish unauthorized content; leave private inputs and historical receipts intact.
