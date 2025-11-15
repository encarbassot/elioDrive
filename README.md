# 🥝 elioDrive

### elioDrive es una pequeña herramienta para publicar una carpeta con archivos (fotos, vídeos, documentos, etc.) como si fuera tu propio drive privado.

[LIVE DEMO](https://fabrega.cat/elioDrive)

> \[!TIP\] Funciona con cualquier servidor de archivos estáticos
> (Apache, Nginx, etc.).

# 1. Descarga el repositorio

Una vez funcionando tu servidor web, por ejemplo en `/var/www/html`:

``` bash
cd /var/www/html
mkdir fotosVerano
cd fotosVerano
git clone https://github.com/encarbassot/elioDrive.git
```

> \[!NOTE\] Puedes borrar los archivos de ejemplo y este mismo archivo
> README.md después de leerlo.

# 2. Copia tus archivos

Tu proyecto debería quedar así:

    /fotosVerano/
      index.html
      eliodrive/
      foto1.jpg
      foto2.jpg
      videos/video1.mp4
      documentos/nota.txt
      ...

> \[!WARNING\] El archivo index.html y la carpeta eliodrive/ son
> necesarios para que todo funcione. Asegúrate de no modificarlos ni
> borrarlos.

*Tranquilidad: estos elementos no serán visibles públicamente.*

# 3. Generar el manifest.json

Este paso es importante. Si no generas el archivo manifest.json, tus
archivos no serán visibles.

``` bash
cd eliodrive
sudo chmod +x script.sh
./script.sh
```

El script lee la carpeta padre desde donde se ejecuta, escanea todos los
archivos y genera el archivo manifest.json.

# Todo listo

Si has seguido los pasos, tus archivos ya estarán disponibles desde tu
servidor.\
Siéntete libre de modificar el código, cambiar los estilos o añadir
nuevas funcionalidades.

------------------------------------------------------------------------

Icons from
[file-icon-vectors](https://github.com/dmhendricks/file-icon-vectors/tree/master/dist/icons/square-o)
