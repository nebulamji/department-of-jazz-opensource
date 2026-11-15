# THEATER — community cinema engine (prototype)

A **new community**, separate from JazzCats and Department of Jazz. Discord is the writers' room; one THEATER account is the curated cinematic outlet, with a separately permissioned CC0/community remix lane. The NFT mint assigns role capabilities rather than speculative returns.

## Working local prototype
```sh
node packages/community-theater/src/demo.mjs
node --test packages/community-theater/test/*.test.mjs
```
The demo simulates sources -> approved scene -> zero-budget render job -> delivery receipt. It does **not** generate or publish a video or perform a wallet transaction. The package has no live Discord connection yet.

## Reuse map: reference implementations, adapters only
- Department of Jazz: `story/SCHEMA.md`, `pipeline/graph_api.py`, `room_to_graph.py`, `story_api.py`, `evals.py`, `attested_run.py`, `WORKERS.md`. These provide typed canon, chat-sourced graph, manifest compilation, evaluation and render receipts. New worlds must use their own canon, not the private DoJ show material.
- Early SRIDA: `RT-DISCORD.md`, `convex/schema.ts` (`a2aEnvelopes`), Discord ingest adapters. Implement a tenant-scoped Convex work queue; never reuse settlement claims as cinematic income.
- JazzCats: holder/role constraints, mint roles, expiring EIP-712 permits and transfer-aware checks. NFT rights require server-verified wallet binding and current chain ownership. Discord role text alone conveys no rights.
- RIDA/Buzz: isolated communities and ACP/MCP tool access. Never expose unrestricted shell capabilities to a community NFT.
- Bind Work: independently checked worker/payment contracts are a **future adapter**, not a current film production settlement.

## Core contract
`contribute` requires affirmative consent; source remains private pending rights review. `propose` requires writer permission and real source receipt(s). `approve` requires director permission. `program` requires canon and zero-budget scope. `claim` requires a capable worker; delivery requires artifact digest. `publish` requires producer capability plus licenses and human-owner approval.

No mint, wallet signer, social account, private source material, external paid model, or automated public posting is connected.

## Build boundaries
Discord slash commands -> verified role snapshot -> contribution ledger -> world graph proposals -> director approval -> DoJ-compatible manifest -> render worker A2A queue -> independent verification -> THEATER publish approval. Research is typed work, credited and cited, never just unreviewed social ingestion.

## Definition of done
One real Discord contribution; verified NFT role; replay-safe persistence; approved manifest; viewable rendered clip; independent QA; explicit rights and human publication approval; transfer/revocation denial; reconciled payment if monetized. All are **future integration gates**, not claimed shipped features.
