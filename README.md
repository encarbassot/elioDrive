# 🥝 elioDrive

### ElioDrive es una pequeña herramienta para publicar una carpeta con archivos (fotos, vídeos, documentos, etc.) como si fuera tu propio drive privado.

[LIVE DEMO](https://fabrega.cat/elioDrive)

> [!TIP]
> Funciona con cualquier servidor de archivos estaticos, (Apache, Nginx ...)


# 1. Descarga el repositorio
Una vez funcionando tu servidor web ej: `/var/html/www`
```bash
cd /var/html/www
mkdrir fotosVerano
cd fotosVerano
git clone https://github.com/encarbassot/elioDrive.git
```

> [!NOTE]
> Los archivos de ejemplo los puedes borrar, y el **README.md** también despues de leerlo (es este mismo archivo)

# 2. Copia tus archivos
Tu proyecto debe verse así:
```
/fotosVerano/
  index.html
  eliodrive/
  foto1.jpg
  foto2.jpg
  videos/video1.mp4
  documentos/nota.txt
  ...
```

> [!WARNING]
> el **index.html** y la carpeta **eliodrive/** son necesarios para el funcionamiento y son lo que debes descargar,

_No te preucupes, no se van a ver publicamente_

# 3. Generar el manifest.json
Este paso es importante, si no generas el **manifest.json** tus archivos no serán visibles.
```bash
cd eliodrive
sudo chmod +x script.sh
./script.sh
```

el script lee la carpeta padre desde donde se ejecuta
esto escanea todos los archivos y genera el **manifest.json**

# LISTO!
Si lo has hecho todo bien tus archivos ya están disponibles en tu servidor, sientete libre para tocar el código, cambiar los estilos o implementar funcionalidades.









icons from [file-icon-vectors](https://github.com/dmhendricks/file-icon-vectors/tree/master/dist/icons/square-o)