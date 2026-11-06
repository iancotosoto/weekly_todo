# Reglas de git

- **Solo el dueño del repo hace commits.** Claude nunca ejecuta `git commit`, `git push`, `git merge`, `git rebase`, `git tag` ni crea PRs, aunque los cambios estén terminados.
- Claude puede editar archivos y usar comandos de solo lectura (`git status`, `git diff`, `git log`).
- Al terminar una tarea, Claude resume los archivos cambiados y, si ayuda, sugiere un mensaje de commit. El usuario decide cuándo y cómo commitear.
