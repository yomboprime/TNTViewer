# How to regenerate the parts and models database

Files in this directory:

- ```createModelsDataBase.js``` - A node.js script that will regenerate the ```models.json``` main database file, as well as the ```tnt_parts.html``` and ```tnt_models.html``` HTML list files.
- ```models.json``` - The main database file used by TNTViewer. This will be overwritten.
- ```TENTE Refs - Visor TNT - RefsTENTE.tsv``` - This file is a dump of the [Listado completo de Referencias y Catálogos de TENTE](https://tente.spread.name/) online Database, by **abeldb**. It is used to get titles for official models and a link to the model in the database.
- ```partslist.tsv``` - This file is a list of part names dumped from http://tenteros.land/tente/index.php/pieza

The other files used to generate the database are all ```.ldr``` models uder the ```TENTE/models/``` subdirectory, as well as the ```TENTE/parts``` files.

To regenerate the database:

```shell
cd TNTViewer/examples/models/ldraw/TENTE/models
node createModelsDataBase.js
```



## Credits

The LDraw file format and LEGO parts library by [LDraw.org](https://www.LDraw.org)

The TENTE parts library used in TNTViewer is licensed under [CC BY 4.0 by the community at tenteros.land](http://tenteros.land/foro/viewtopic.php?f=47&t=154)

The [TENTE models repository](https://gitlab.com/cpcbegin/tentemodels) used in TNTViewer is GPLv3 licensed by **cpcbegin**.
