# Deployment instructions

The canonical production and user-facing URL is:

`https://tlibman.github.io/grader-releaser-auditing/`

Always open, verify, and report that URL.

This public repository owns the compiled static reviewer workspace. Its source and the local encrypted API live in the private `tlibman/aops-grading-audit` repository. Application changes must be implemented and built there, then the generated `pages-dist/` assets are published here and verified through the canonical URL.

The user has authorized publishing validated website changes to the existing public deployment without asking again. Never add sensitive audit or warehouse data to this repository.
