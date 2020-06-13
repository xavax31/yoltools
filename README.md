<div style="background-color:orange">!! Only for my personal needs, this package is not maintained and is useful only for me !!</div>

A personal tool to automate the creation of different types of my development stuff, and an example of custom npm global package.


# Installation

```
npm install -g yoltools
```

# Usage

```
yoltools  # show help and possible features
```


# Notes

L'installation sur mac va installer le package dans usr/local/lib/node_modules
et créer un alias dans usr/local/bin, afin de rendre accessible de manière globale, les commandes dans package.json, objet 'bin', donc ici 'yoltools'. (on peut en mettre plusieurs)
Cependant le dépot git ne peut pas etre présent dans ce dossier, car pour tester l'installation via npm install -g yoltools, une erreur apparait, disant que l'install ne peut supprimer le .git.
Pour pouvoir donc modifier le code du package, l'utiliser en local directement sans publier, et pouvoir tester l'install globale via npm, 2 solutions:

1 - Travailler directement dans le dossier usr/local/lib/node_modules/yoltools avec le depot git dedans, en ne faisant que publier lorsque nécessaire, mais on ne pourra pas tester l'install, ce qui peut ne pas être utile.
2 - déplacer le projet avec depot git dans un autre dossier de travail, et remplacer le lien symbolique dans usr/local/bin par un pointant vers ce nouveau dossier. Permet de tester l'install, par contre une fois testé, il faut remettre l'alias à la place pour repointer vers le dossier de travail.
Pour créer l'alias, aller dans et saisir: sudo ln -s <path to working dir/>bin/yoltools.js yoltools

La structure de dev pour simplifier la maintenance est:

Le projet avec son dépot git est dans un dossier hors du dossier des node_modules globaux (usr/local/lib/node_modules sur mac)



