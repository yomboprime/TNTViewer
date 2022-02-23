# TNT Viewer<img src="examples/TNTicon/icon.svg" alt="icon" width="160"/>
TNTViewer is a 3D model viewer for the LDraw format that lets you view interactively an animation of the construction steps of the model.

**Play online at**: https://yomboprime.github.io/TNTViewer/examples/tnt.html

View complete model list: https://yomboprime.github.io/TNTViewer/examples/tnt_models.html

View complete parts list: https://yomboprime.github.io/TNTViewer/examples/tnt_parts.html

You will see a 3D model and can rotate, zoom, pan, etc with your mouse or touch screen. In the control panel at the right side you can start/pause the animation, control the playback rate, and when paused you can go to any construction step or go forwards/backwards one step at a time. Hot keys: Space: Play/pause. Cursor left/right: Go back/forward one step.

When viewing a part from the parts list (or a model that uses the main color code 16) you can also change the color of the part. Please see 'Options' panel folder.

Most of the original official models by TENTE (subfolder ```models/oficiales```) also show a model link to [this database by **abeldb**](https://tente.spread.name/) with more information and case pictures.

## How to use your own models

You can run TNTViewer in any HTTP server you can run locally, just clone this repo (this command will create the folder ```TNTViewer```):

```shell
git clone https://github.com/yomboprime/TNTViewer.git
```

And move this folder to your web server content folder. TNTViewer is a pure static HTML5 web application, so you just need to serve the files. Having the models locally lets you modify them and update the viewer by just pressing F5. Keep in mind that if you add models or parts or rename them, you need to run the createModelsDataBase.js script (see below) to update the web app.

The TENTE models and parts are located under ```TNTViewer/examples/models/ldraw/TENTE/models``` and ```TNTViewer/examples/models/ldraw/TENTE/parts``` respectively. You can put any ```.ldr``` files you want under any subfolder you create inside ```models/```. Then issue the commands:

```shell
cd TNTViewer/examples/models/ldraw/TENTE/models
node createModelsDataBase.js
```

You will need to install [NodeJS](https://nodejs.org/) first. If ```node``` is not found, perhaps in your system it is called ```nodejs``` instead.

This will update the ```models.json``` index file used in the viewer, as well as the HTML files ```TNTViewer/tnt_models.html``` and ```TNTViewer/tnt_parts.html``` which are the models and parts lists. Then just refresh your browser by pressing F5.

LEGO parts library is not currently included due to its large size.

### Spanish tutorial on how to install locally

For a spanish TNTViewer installation tutorial made by **cpcbegin**, the author of the models repository, please go to: https://malagaoriginal.blogspot.com/2022/01/visor-web-de-modelos-ldraw-y.html

## How to contribute with LDraw models

If you want to contribute with models just drop a PR or an issue here, or in the [TENTE models repository](https://gitlab.com/cpcbegin/tentemodels) at Gitlab used in this project. We are hoping to grow the database and fix errors in models and parts thanks to this viewer.

## License

TNTViewer is MIT licensed.

## Credits

The LDraw file format and LEGO parts library by [LDraw.org](https://www.LDraw.org)

The TENTE parts library used in TNTViewer is licensed under [CC BY 4.0 by the community at tenteros.land](http://tenteros.land/foro/viewtopic.php?f=47&t=154)

The [TENTE models repository](https://gitlab.com/cpcbegin/tentemodels) used in TNTViewer is GPLv3 licensed by **cpcbegin**.
