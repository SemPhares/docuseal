# Modifications iSHEERO

Version de DocuSeal utilisée par iSHEERO (Initiative des acteurs béninois de l'IA) sur
https://sign-isheero.com. Basée sur DocuSeal **3.3.0** (tag `3.3.0` de
https://github.com/docusealco/docuseal), distribuée sous la même licence :
AGPLv3 avec les conditions additionnelles de `LICENSE_ADDITIONAL_TERMS`.

L'image officielle `docuseal/docuseal:3.3.0` est utilisée telle quelle ; seuls les fichiers
ci-dessous sont remplacés.

| Date | Fichier | Modification |
|---|---|---|
| 2026-10-14 | `app/views/layouts/mailer.html.erb` | Logo iSHEERO en tête des mails ; pied « Envoyé avec DocuSeal » retiré des mails (l'attribution et le lien vers ce code source restent sur les pages web) |
| 2026-10-14 | `app/views/shared/_powered_by.html.erb` | Lien vers ce code source à côté de l'attribution DocuSeal |
| 2026-10-14 | `app/views/submit_form/_docuseal_logo.html.erb` | Logo iSHEERO en tête de la page de signature (l'attribution DocuSeal reste en pied de page) |
| 2026-10-14 | `app/views/submissions/_list_form.html.erb` | Import d'une liste de destinataires (CSV ou collage depuis Excel) à la place de l'encart « Pro » ; un envoi par ligne via le formulaire standard |
| 2026-10-14 | `public/isheero/bulk-import.js` (nouveau) | Lecture et contrôle de la liste dans le navigateur, sans dépendance |

L'attribution DocuSeal est conservée dans l'interface web (pages de signature), comme l'exige
`LICENSE_ADDITIONAL_TERMS`, avec un lien vers ce code source.

Voir le détail : `git diff 3.3.0 isheero`.
