# FancyBoxPlugins
Optional plugins for FancyBox

## FancyBox VK / RuTube
Плагин VKRT добавляет возможность использовать видео, клипы и shorts из VK и RuTube в FancyBox, указывая их обычными ссылками.

В корне находятся файлы *.vkrt.css и .vkrt.js. Подключаются поверх ваших файлов FancyBox.
В директории /merged/ находятся готовые модифицированные файлы FancyBox. Они уже работают с VK и RuTube и не требуют подключения VKRT отдельно.

Подключается после оригинальных файлов:
```
<link rel="stylesheet" href="fancybox.css" />
<link rel="stylesheet" href="fancybox.vkrt.css" />

<script src="fancybox.umd.js"></script>
<script src="fancybox.vkrt.js"></script>
```

Параметры можно менять в VkRutube.rutube и VkRutube.vk.

Использование:
```
VK/Clips:
<a href="https://vkvideo.ru/video-0000_000000000" data-fancybox="myFancy" data-caption="FancyBox VK Video">FancyBox VK Video</a>
<a href="https://vkvideo.ru/clip00000000_000000000" data-fancybox="myFancy" data-caption="FancyBox VK Clip">FancyBox VK Clip</a>

RuTube/Shorts:
<a href="https://rutube.ru/video/any0video1url2/" data-fancybox="myFancy" data-caption="FancyBox RuTube Video">FancyBox RuTube Video</a>
<a href="https://rutube.ru/shorts/any0short1url2/" data-fancybox="myFancy" data-caption="FancyBox RuTube Short">FancyBox RuTube Short</a>
```
