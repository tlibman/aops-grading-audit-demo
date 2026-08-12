# Deployment instructions

The canonical production and user-facing URL is:

`https://tlibman.github.io/grader-releaser-auditing/`

Always open, verify, and report that URL. Never present the `iframe` source URL from `index.html` as the finished site or send it to reviewers.

This public repository owns only the GitHub Pages shell. The real application, encrypted APIs, and storage integration live in the private `tlibman/aops-grading-audit` repository. Application changes must be implemented and published there, then verified through this GitHub Pages URL.

The user has authorized publishing validated website changes to the existing public deployment without asking again. Never add sensitive audit or warehouse data to this repository.
