rm ./*.png
unzip -u ./thumbnails.zip
ext=ppm
next=png
for f in *.$ext; do
ffmpeg -y -i "$f" "${f/%$ext/$next}"
done
rm ./*.ppm
rm ./thumbnails.zip
