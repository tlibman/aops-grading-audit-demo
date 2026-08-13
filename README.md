# AoPS Audit Workspace

Canonical production site: https://tlibman.github.io/grader-releaser-auditing/

This repository publishes the compiled static teammate reviewer workspace maintained in `tlibman/aops-grading-audit`.

The owner's Mac publishes ciphertext-only batch packages under `data/batches/` and an integrity index at `data/batches.json`. The website loads them automatically. Reviewers unlock them locally in the browser and download encrypted result files for Mission Control to import. The site does not require an account or a connection to the owner's Mac.

No plaintext batch data, warehouse data, decrypted submissions, audit notes, passwords, credentials, or encryption keys belong in this public repository.
