# THEATER — agent execution instructions

READ FIRST: `docs/ONE-SHOT-AGENT-BUILD.md`, then `README.md`, then current `src/**`, `test/**`, followed by each referenced source repository's `AGENTS.md` and authoritative code. This package's `AGENTS.md` is subordinate to the detailed one-shot contract.

Goal: Discord-native collaborative cinematic worlds with verified NFT mint roles, scoped A2A creative agents, one official THEATER screening account and independently opted-in CC0/open-source output. Deliver one actual watched video through consented community inputs, canon proposal/approval, production and proof.

Minimum run:
```bash
cd packages/community-theater
npm test
npm run demo
```
Tests were authored in GitHub but the GitHub connector cannot run them; execute in a fresh checkout and save `evidence/RECEIPT.json`. `npm start` requires a **new** registered Discord app and guild; credentials remain external. This is not yet a production service. Existing bot refuses to replay a nonempty event ledger: implement durable replay in P1 before inviting users.

Source contracts are references, not blanket legal permission to redistribute private code. Use private integration repository/branch; public repo contains only safe code, generic interfaces, synthetic examples and consented CC0 media. Do not duplicate or expose private DoJ corpus, company operations, tenant details or access keys.

DO NOT mint, deploy, trade, sign, spend, send social content or change production infrastructure without narrowly scoped operator approval. Any role/NFT ownership must be checked by a server-side authorized chain read at effectful action time; Discord role names don't authorize operations.

Mandatory completion: source locks, runnable tests and receipts, persistent Discord flow, deterministic/LLM world synthesis with provenance, actual playable media artifact, licensed publication gate, transfer/replay/tenant negative tests. If blocked, land bounded code and `BLOCKERS.md`—not promises or fabricated outcomes.
