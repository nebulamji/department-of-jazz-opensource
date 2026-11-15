# THEATER — One-shot Agent Build Contract
**Status:** Build-ready implementation specification, not a declaration of live service. **Purpose:** A coding agent, starting with this checkout and read-only access to designated private source repos, can build a self-contained Discord-first community cinema product with source-pinned, separately authorized adapters. Current branch is a public open-tools prototype; use a private target repository for actual integration and do not import private contents into this public repo.

## Mission — product (do not scope-creep)
Launch one **new** creative community, brand placeholder **THEATER**. A member submits permissioned ideas/art/research in Discord; distinct roles and creative agents transform material into a source-attributed fictional world; scenes become approved cinematic manifests; workers create media; THEATER's single official account premieres approved cinema. Separate opt-in CC0 community output and open-source SDK. NFT mint outcomes determine bounded role classes. The economic system funds actual commissioned work without speculative/yield promises. Bankr-like social mentions generate *intake requests*, not autonomous custody, market actions or ungated posting.

Product north star: **two members, one agent, one approved scene, one independently checked actual video screening**. In the first screen, a member sees only **Contribute / World / Watch / My Role**, not an enterprise control plane. Discord is the primary product; a minimal public screening page is secondary. No game, generalized SaaS OS, clone of DoJ, token-trading bot, or broad DAO voting surface.

## Source inspection, latest branches, and reproducibility
Use fresh GitHub checkout and record each source `git rev-parse HEAD`, default branch, tested commit, modified files, and source license in `evidence/SOURCE-LOCK.json`. These are references—not transfers of ownership, code, data or copyright. A source path named below is a **candidate** until inspected on that pinned SHA. Never infer mainnet readiness from README claims. Existing JazzCats acceptance is HOLD; ArtOfficial calls itself NOT LIVE.

| Read order | Source repo | Initial files/paths | Why | Reuse mode |
| --- | --- | --- | --- | --- |
| 0 | `department-of-jazz-opensource` | `packages/community-theater/**`, `LICENSE` | Starting prototype and current tests | Local fork of **this new package** |
| 1 | `department-of-jazz-show` | `story/SCHEMA.md`, `story/THESIS.md`, `pipeline/graph_api.py`, `pipeline/story_api.py`, `pipeline/room_to_graph.py`, `pipeline/WORKERS.md`, `pipeline/evals.py`, `pipeline/attested_run.py`, `pipeline/consultant_mcp.py` | World/graph/scene/worker/evaluation reference | Typed and versioned **adapter**; never publish show's private corpus |
| 2 | `srida` | `RT-DISCORD.md`, `convex/schema.ts`, `convex/a2a.ts`, `autowiki/adapters/discord_ingest.py` | Discord/A2A/Convex loop | New isolated tenant tables; fix duplicate route + unauthenticated ACK issues before reuse |
| 3 | `jazzcats` | `contracts/src/JazzCatsGenesisRoles.sol`, `contracts/src/JazzCats.sol`, `shared/game/play-permit.mjs`, `server/maintained-task-authority.mjs`, `docs/ship/HOLDER-FINITE-PERMIT-CONTROLS.md`, `docs/JAZZCATS-ONE-PRODUCT-INTEGRATION-CANON-2026-11-09.md` | NFT role issuance, signed user authority, transfer epochs, EVM patterns | Contract-design reference, not deployment/migration |
| 4 | `jazzcats-continuation` | `README.md`, `acceptance/current.json` | Latest hold and actual chain acceptance distinctions | Evidence read only |
| 5 | `onchainartofficial` | `AGENTS.md`, `docs/ARCHITECTURE-AND-INVARIANTS.md`, `src/artist.mjs`, `src/ledger.mjs`, `docs/ECONOMY-GTM-AND-EXPERIMENTS.md` | Autonomous *artist* agency and provenance, exhibition and work NFTs | Optional independent artist *lane* with **no human direction**; do not falsely merge its autonomy model into directed THEATER story |
| 6 | `artofficial-computer`, `pianonymity-art-machine` | inspect art engine and trait generator interfaces | Rights-aware generative art and image pipelines | Import only licensed modules after source review |
| 7 | `rida-workspaces`, `companyos-edge`, `envoy` | READMEs, agent API/MCP, scoped execution and metering | Commercial agent permissions, receipts, buyer/commission workflows | Isolated capability API; never expose private tenant proxies or sender tokens |
| 8 | `client0-control-plane` | `initiatives/covenant-rail/contracts/src/SwarmJobs.sol`, `ScopedNftAction.sol`, `CrossSwarmGate.sol`, `swimmers/README.md` | Work/checker/payment rails, transfer-bound delegated rights, NFT intelligence | After proof, opt-in adapter; no treasury keys |
| 9 | `frontier` | `README.md`, `AGENTS.md` | Bounded F0–F13, proofs, gated writeback | Build-agent evaluation and authorization gates, not user UI |

The `rida` repo is a renamed Buzz upstream; `rida-workspaces` + Envoy/Edge are the actual customer/product surfaces. Do not treat Buzz as the RIDA economic integration. Keep private architecture, names, keys and internal paths off marketing pages.

## Critical product distinction
THEATER is **collaborative, community-and-human-directed cinema**. Onchainartofficial's artist identity explicitly forbids holder/director aesthetic steering: use it only as a separate, self-directed guest artist. THEATER directors may approve canonical scenes; that action must not be attributed to an independent ArtOfficial Artist NFT. Keep creative intent, proposal, curator decision, and execution separate in all receipts.

## One-shot architecture and boundaries
```
  [DISCORD members + verified roles]        [X/other social read-only opt-in]
                  |                                   |
           signed interaction                   provenance intake
                  +------------------+----------------+
                                     v
                            Source/Research Ledger
                       (consent, rights, visibility, proof)
                                     |
                Research Agent -> synthesis -> canon proposal
                                     |
                       Human creator/editorial gate
                                     v
                 GitHub versioned WorldGraph/Character/Scene
                                     |
                      DoJ-compatible storyboard manifest
                                     |
                   Convex A2A job / capability dispatch
                                     |
             Blender/image/voice/music/render worker -> checker
                                     |
                      THEATER HUMAN RELEASE GATE
                                     |
                   Official THEATER cinematic screening
                  /                                   \
         Theater social account                 Opt-in CC0/remixes
                  \                                   /
                       public discovery / onboarding
```

Immutable primitive IDs: `world_id`, `user_id`, `wallet_binding_id`, `token_id`, `role_version`, `source_id`, `graph_node_id`, `revision_id`, `scene_id`, `job_id`, `artifact_sha256`, `receipt_id`. All effectful operations require signed server-side world scope and policy checks, never Discord display roles or agent natural language.

**Single source of truth:** Convex stores submissions/role snapshots/jobs/outbox, Git commits store only approved world canon and media manifests, onchain state owns NFTs and actual settlement. Avoid triple-writes: use transactional outbox/idempotent consumers, receipts link Convex event -> Git SHA -> artifact digest -> optional chain TX. Git is not a transactional A2A queue. Files/large media go in object storage with content digests; no base64 video in Convex.

## Canonical strict schemas (translate into Convex validators, JSON Schema and tests)
```json
{
  "Contribution": {"worldId":"string","sourceId":"uuid","actorId":"discord-user-id","origin":"discord|social|upload","originEventId":"string","mediaDigest":"sha256|null","textDigest":"sha256","consent":"explicit:boolean","license":"private|proposed|cc0|custom","visibility":"private_review|community|public","status":"intake|triaged|rejected|proposed|approved","createdAt":"timestamp"},
  "WorldNode": {"id":"type:uuid","worldId":"string","kind":"character|location|scene|signal|style|material|institution","revision":1,"supersedes":null,"edges":["type:uuid"],"sources":["sourceId"],"status":"proposal|approved|retired","authorIds":["id"],"canonApprover":"id|null","changeDigest":"sha256"},
  "WorkOrder": {"worldId":"string","workId":"uuid","attempt":1,"kind":"research.sources|world.propose|cinema.storyboard|cinema.render|cinema.check|cinema.publish","status":"requested|authorized|queued|claimed|delivered|verified|rejected|published|cancelled","capability":"string","inputDigest":"sha256","approvalId":"string|null","workerId":"string|null","checkerId":"string|null","budgetCurrency":"USD","budgetMaxMinor":0,"expiry":"timestamp","artifactDigest":"sha256|null","evidenceIds":["receiptId"]},
  "WalletRoleSnapshot": {"worldId":"string","discordId":"string","walletAddress":"eip55","chainId":"integer","collection":"address","tokenIds":["uint256-string"],"ownershipEpoch":"string","roleManifestHash":"sha256","verifiedAt":"timestamp","expiresAt":"timestamp","signatureChallengeId":"string","revokedAt":"timestamp|null"},
  "Publication": {"worldId":"string","artifactDigest":"sha256","canonicalSceneId":"string","licenseEvidenceIds":["receiptId"],"reviewerId":"string","releaseApproverId":"string","channels":["theater|x|cc0"],"postedMessageIds":["string"],"state":"draft|ready|posted|withdrawn"}
}
```

No schema alone confers legal rights, source authenticity, or current token authority. Inputs must be validated at boundary. Approver cannot attest own independent check. Sources with absent consent/ambiguous licenses stay private and cannot train public derivatives.

## NFT/mint contract specification
**Proposed chain: Base, decision pending live compatibility verification.** Use exact chain ID 8453 when configured, read RPC chain ID and target contract code hash on every environment, and require fresh current-chain ownership. Use standalone audited ERC-721 or ERC-1155 (explicit decision log) with transparent immutable deterministic or committed-reveal trait allocation; different minted characters map to `audience, archivist, writer, actor, director, producer`. Minted role does not grant treasury authority, copyright, guaranteed yield, or unrestricted social posting. The **first release must support a free no-token contribution route**. Pre-mint role assignment and rarity must be disclosed; if randomized, commit before purchase and verify reveal. No post-mint silent privilege retcons. No token transfers, issuance, or fee-bearing deployment without explicit operator approval.

Wallet binding: issue random one-use nonce linked to Discord OAuth identity, SIWE/EIP-4361 message with domain, chain ID, issuedAt, expiration and resources, verify EOAs and EIP-1271 where applicable, consume nonce exactly once. Verify live token ownership at a safe head and include ownership epoch/block; reject transfers, including away-and-back; privileged actions revalidate (not simply cache TTL). Use an allowlist of contract methods and explicit human approval for treasury/signers.

## Autonomous art lane (separate from community direction)
Onchainartofficial artist may **choose** to submit an artistic interpretation of public licensed source packets. Its chosen works, publish intent and show participation are distinct from user/editor-directed character/film work; cannot claim independent autonomy for a director-approved scene. It has its own capability and budget gate. Work NFT minted only after licensed artifact verification and independent settlement evidence.

## Economy and receipts
Use USDC (Base ERC-20 after live token/address confirmation) for genuine commissions, subscriptions and edition sales; roles are participation/access, not investment rights. Track quote, escrow/reserve, invoice, worker obligations, license, refund, payout and provider/render costs separately. Authorize spend caps per job and never auto-trade/mint/promote memecoins. Optional paid mint is a *distribution* experiment after audited contracts and real onboarding. Do not count token mint revenue, transfer volume or synthetic wallets as proof of creative product demand. Initial primary metric: paid repeat commissions / completed licensed screenings, plus proof latency and marginal compute cost.

## User experience (max 4 primary affordances)
**Discord:** #welcome (one-click join), #contribute, #world, #theater; backstage channels appear by verified role. The bot uses slash commands; **never raw channel scroll ingestion by default**. One agent narrator communicates in-world, multiple behind-the-scenes workers. Screenings in a single official account; no fan account has its publishing credentials. Minimal web: Watch, Explore World, Join/Verify, Credits. Operator console is separate/private: pending sources, rights, approved proposals, jobs, verification, funds, publish.

## Integrations — complete adapters, never blanket merges
Implement `SourceIngestAdapter`, `ResearchAdapter`, `WorldGraphAdapter`, `CinematicManifestAdapter`, `RenderWorkerAdapter`, `AgentCapabilityAdapter`, `NFTVerificationAdapter`, `EconomicWorkAdapter`, `PublicationAdapter`. Each exposes `health()`, strict `inputSchema`, `execute()`, `verify()`, `rollback()`. When a source system cannot prove live auth/permissions, return `NOT_READY` and use simulated fixture—not silent fallback to unauthenticated calls.

### Execution plan — build this, not another spec
**P0 — Source pin and honest baseline:** clone designated sources read-only; source SHA/branch lock; run existing Theater tests, source smoke where permitted, dependency vulnerability/secrets scan; write machine-readable pass/fail evidence. No public secrets.
**P1 — Repair prototype:** fix source ID cryptographic randomness, atomic/event replay and corruption recovery, implement state rebuild, conflict-safe writes, cross-world isolation; eliminate relying on in-memory-only A2A. Add deterministic test fixtures.
**P2 — Discord one-guild real intake:** OAuth slash commands, user consent and idempotency (interaction ID), queued outbox, moderation and evidence; don't mirror private messages; rate-limit; transcript deletion handling.
**P3 — Role mint verifier:** Base read-only contract proof plus SIWE and fresh ownership rechecks, integration with real deployed **existing authorized** token first; negative transfer, stale epoch and Discord spoof tests; role mint later.
**P4 — World synthesis:** retrieval over licensed materials, typed world graph with revision+provenance, candidate dedup, coherence eval and canon approval; model can suggest, not silently rewrite. Expose world state in Discord and a sparse web viewer.
**P5 — Scene-to-video:** adapter from approved graph scene to DoJ-compatible shot manifest; headless Blender render (real pixels, sound optional), independent checker, reproducible artifact SHA; one real 15–60s screening. Require usable cinematic content, not a JSON receipt masquerading as film.
**P6 — Economy:** real quoted paid commission with operator-approved USDC payment or external checkout, independent receipt reconciliation, budget and rights contract. Mint only when access demand demonstrated and reviewed.
**P7 — Theater distribution:** official account owner-gated scheduled premiere, canonical metadata, credited rights opt-ins, CC0 derivatives only if licensed. Social listener read-only and opt-in by default.
**P8 — Production deployment:** clean tenant, alerts/backups, abuse/takedown, security and contract review, rollback rehearsal. Deploy only after operator approval of named environment/addresses and funds.

### Required executable tests
- Empty repo fresh install, `node --test`, and a no-credential local simulated E2E fixture.
- Discord duplicate interaction and two different users posting identical content => two credits, one content graph candidate.
- Source private by default, CC0 not inferred, takedown prevents next release.
- Source-to-canon transition produces exactly one approved revision; conflicting approvals rejected.
- Wallet wrong-chain, replay challenge, fake Discord role, expired snapshot, wallet transfer-away-and-back, EIP-1271 contract, RPC failure all deny privilege.
- A2A duplicates, out-of-order ACK, worker timeout/re-claim, deliberate checker collusion, stale Git SHA, cross-world leakage, budget overspend.
- Agent prompt injection in meme/Discord source does NOT become tool invocation or role policy.
- Manifest lint and independent media checksum/duration/resolution/frame-rate review.
- Social publish failed network -> uncertain result receipt; NEVER blind repeat a post.
- Paid commission quote vs settlement vs refund vs license; no paid claim without independent receipt.
- Cold restart preserves canon and delivery history. One process crash mid-transaction cannot create duplicate film or spend.

### Human-controlled gates
**G0:** private source usage rights and repo refs.
**G1:** new Discord guild/bot setup and token scopes.
**G2:** external provider and production resources.
**G3:** mint contract/chain/price/role distribution and legal terms.
**G4:** actual wallet signatures, onchain TX, treasury/payment.
**G5:** film rights, publication and social posting.
**G6:** production deployment/rollback.

Do not request G3–G6 before a real film/video proof. Run read-only and local simulated tasks without credentials. No arbitrary code execution from Discord. No keys/signatures in model prompts.

## One-shot definition of DONE (do not self-certify)
`npm test` and new end-to-end test pass in a clean checkout; create/restart Discord test guild app; record two real permissioned source contributions; current NFT owner role verified and transfer revocation demonstrated; original world/scene generated and approved; actual video compiled/rendered and independently checked; one authorized THEATER screening published; clear revenue status and optional real buyer invoice; observer can replay the source/event/manifest/media receipt chain; rollback rehearse without data loss. If blocker (no chain mint, guild ID, bot token, render hardware, owner legal approvals) STOP at precise boundary and publish `BLOCKERS.md` and `evidence/RECEIPT.json`, with tests and logs. Never invent live users, payments or published films.

## Agent start instruction
> You are the implementer. Read this file, `AGENTS.md` in each referenced repository, and the existing prototype. Create a **private integration target repo or private branch**; preserve original repositories. Pin source SHAs, then implement P0→P5 with proof receipts, completing P6→P8 only after named approvals. Prioritize one authentic real video over ten untested integrations. Produce a usable Discord experience for human members, not a complex portal. Every claim must include execution evidence. No secrets, private architecture, machine paths or internal source text in client-facing artifacts.
