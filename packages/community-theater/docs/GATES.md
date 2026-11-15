# THEATER — Security, readiness, and compliance gates

## Decision: Base for Genesis is proposed, not production-approved
The one-shot agent must first confirm chain support and costs, contract code hashes, wallet connectors, RPC reliability, marketplace/support requirements, stablecoin correctness and third-party IP/licenses. EVM role patterns exist in JazzCats, but none alone authorizes minting or transfers on a new THEATER collection. Robinhood Chain and Avalanche are future adapters only, not multi-chain scope for first release.

## Proven boundaries
- Present prototype: JavaScript library and Discord slash adapter that currently only allows /world, /screening, /contribute. **No live Discord deployment or role proof.** It currently refuses startup if prior event ledger is present because rehydration isn't implemented yet.
- Present proposal/approval: role string is a **unit-test fixture**, not identity proof. Effectful production commands must bind a verified Discord actor + wallet chain snapshot and human approver in a trusted API, not accept `role='director'` from external calls.
- Present A2A: in-memory duplicate handling only. Convex server mutations need durable unique idempotency keys, authenticated ack, leases, retry, worker identity and isolation.
- Present provenance: a hash-link without immutable trusted timestamp/anchor is merely local tamper evidence, not proof of ownership or settlement. Local ledger needs replay, backups, append atomicity, repair and snapshot reconciliation.
- Existing source `srida/convex/a2a.ts` has a routing path that inserts by user-supplied ID without duplicate check; ACK checks `ackedBy` string but does not authenticate it in the inspected source. Fix these issues in separate new tables; do not copy raw implementation.
- Existing `onchainartofficial` Artist NFT is **autonomous** and should not receive human-directed prompt control. A THEATER community director may edit *story canon*, but never impersonate artist agency.
- CC0 is **per-opt-in licensed asset** only. Discord upload is not a blanket copyright grant. AI-generated material may lack copyright protection; do not promise enforceable IP rights merely because a token is minted.

## Owner approval gates
1. Create new Discord app, one guild, and invite bot with minimum privileges; store token only in secret manager.
2. Select a private repository for licensed integration adapters (public `department-of-jazz-opensource` holds only safe contracts and demo).
3. Authorize selected model and actual render worker with capped budget.
4. Sign off chain, NFT collection, distribution, mint terms and smart contract audit before any transaction.
5. Approve first licensed public premiere and social account credentials; use reviewed posts.
6. Approve production deployment and monitoring only after independent validation receipts.

## Failed or withheld operations
If any gate fails, generate a non-financial `BLOCKERS.md` and signed/testable `evidence/RECEIPT.json` with exact execution status and cause. Never silently proceed by mocking wallet proofs, rendering media, third-party purchases or publication. Roll back by disabling Discord commands, stopping queues, revoking scoped sessions and publication authorizations, quarantining source packets, and preserving audit history.
