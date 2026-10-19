# STIZ · Setup Clément

Page de suivi à envoyer à Louma : 9 actions (fiches stores + accès au code) et 7 décisions.
Louma n'a besoin d'aucun compte. Ses réponses arrivent dans un Google Sheet appartenant à Clément.

Coût : 0 €. Hébergement GitHub Pages, données dans Google Sheets via Apps Script.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | La page, autonome (aucune dépendance hors Google Fonts) |
| `apps-script/Code.gs` | Le backend : lit et écrit l'onglet `state` du Sheet |

## Mise en place (10 min, une seule fois)

### 1. Le Google Sheet et son backend

1. Ouvrir [sheets.new](https://sheets.new) avec son compte Google, nommer le fichier `STIZ · Setup`.
2. **Extensions › Apps Script**. Remplacer le contenu de `Code.gs` par celui de `apps-script/Code.gs`. Enregistrer.
3. **Déployer › Nouveau déploiement** › type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
4. Autoriser l'accès demandé par Google (écran « application non vérifiée » : *Paramètres avancés › Accéder au projet*). C'est votre propre script.
5. Copier l'URL qui finit par `/exec`.

### 2. Brancher la page

Dans `index.html`, coller l'URL dans `CONFIG.endpoint` :

```js
var CONFIG = {
  endpoint: "https://script.google.com/macros/s/…/exec",
  token: "928a474bd71801084ded637f",
  contactEmail: "clement@getstiz.com"
};
```

Le `token` doit être identique à `TOKEN` dans `Code.gs`.

### 3. Publier

```sh
git add -A && git commit -m "Brancher le Google Sheet"
git push
```

GitHub Pages republie la page en une minute environ.

## Fonctionnement

- Chaque clic de Louma part tout de suite dans le Sheet. La page relit le Sheet toutes les 20 s, donc Clément voit l'avancement sur la même page ou directement dans le Sheet (colonne `résumé`).
- Hors connexion, ou sans endpoint configuré, tout reste dans le navigateur. La page affiche « Hors ligne » et Louma peut copier ou envoyer le récap par email.
- Si deux écritures se croisent, la plus récente gagne (champ `at`).

## Sécurité

- **Aucun secret dans cette page ni dans le Sheet.** Mots de passe par SMS, clés de dev par Bitwarden Send.
- La page et le serveur refusent tous les deux ce qui ressemble à une clé (`sk_…`, `eyJ…`, `service_role`, `ghp_…`, « mot de passe : »).
- Le jeton empêche seulement les écritures de robots au hasard : il est lisible dans le code source de la page publique. Pour couper l'accès, archiver le déploiement Apps Script (**Déployer › Gérer les déploiements**).
- La page est en `noindex` : les moteurs de recherche ne la référencent pas, mais toute personne qui a l'URL peut l'ouvrir.

## Modifier le contenu

Tout le texte est dans `index.html`, dans les tableaux `STEPS` et `DECISIONS` en haut du script. Le reste de la page se construit à partir d'eux. Si vous ajoutez une action, gardez un identifiant du type `s10` : le serveur n'accepte que `s` ou `d` suivi d'un ou deux chiffres.
