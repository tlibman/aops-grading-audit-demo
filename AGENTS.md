# Deployment instructions

The canonical production and user-facing URL is:

`https://tlibman.github.io/grader-releaser-auditing/`

Always open, verify, and report that URL.

This public repository owns the compiled static reviewer workspace. Its source and the Mission Control application live in the private `tlibman/aops-grading-audit` repository. Application changes must be implemented and built there, then the generated `pages-dist/` assets are published here and verified through the canonical URL.

The user has authorized publishing validated website changes and encrypted batch packages to the existing public deployment without asking again. Only the local Mission Control publisher may write `data/batches.json` and the ciphertext packages under `data/batches/`. Never add result exports, plaintext submissions, passwords, keys, credentials, local audit records, or warehouse data to this repository.
