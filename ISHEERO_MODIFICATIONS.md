# Modifications iSHEERO

Version de DocuSeal utilisée par iSHEERO (Initiative des acteurs béninois de l'IA) sur
https://sign-isheero.com. Basée sur DocuSeal **3.3.0** (tag `3.3.0` de
https://github.com/docusealco/docuseal), distribuée sous la même licence :
AGPLv3 avec les conditions additionnelles de `LICENSE_ADDITIONAL_TERMS`.

L'image officielle `docuseal/docuseal:3.3.0` est utilisée telle quelle ; seuls les fichiers
ci-dessous sont remplacés.

| Date | Fichier | Modification |
|---|---|---|
| 2026-10-14 | `app/views/layouts/mailer.html.erb` | Logo iSHEERO en tête des mails, lien vers ce code source en pied de mail |
| 2026-10-14 | `app/views/shared/_powered_by.html.erb` | Lien vers ce code source à côté de l'attribution DocuSeal |

L'attribution DocuSeal est conservée dans l'interface et dans les mails.

Voir le détail : `git diff 3.3.0 isheero`.
