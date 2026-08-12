# AoPS Audit Workspace

Canonical production site: https://tlibman.github.io/grader-releaser-auditing/

This repository publishes the public GitHub Pages entry point for the encrypted AoPS team-audit workspace. The page in `index.html` embeds the collaboration application maintained in the private `tlibman/aops-grading-audit` repository.

GitHub Pages is static hosting, so it cannot run the encrypted API, D1 database, or R2 object storage. Those services remain on the application host; the GitHub Pages address above is nevertheless the only canonical user-facing URL and the only link that should be given to reviewers.

No warehouse data, decrypted submissions, audit notes, passwords, credentials, or encryption keys belong in this public repository.
