<a name="v0.0.8"></a>
### v0.0.8 (2013-10-22)


#### Bug Fixes

* **desktop:**
  * Only scroll if vertical delta ([22bf70e0](http://github.com/ajoslin/angular-scrolly/commit/22bf70e018aa132294ad5f3d04a674b208aef024))
  * unbind keydown when scroll elm is destroyed ([51500ce9](http://github.com/ajoslin/angular-scrolly/commit/51500ce93087f5e62e84207e465722710afc3d17))
* **dragger:**
  * force end event to always fire no matter direction ([d3ddb75a](http://github.com/ajoslin/angular-scrolly/commit/d3ddb75a063b337d2b4a7cef3021b14d493512e0))
  * stop propagation, so scroll on popups works ([2006b0bc](http://github.com/ajoslin/angular-scrolly/commit/2006b0bc658c78d4349ef718b860c557cd3a7e97))
* **scroller:**
  * remove scroll event ([c8b170e2](http://github.com/ajoslin/angular-scrolly/commit/c8b170e29728d488ec4a312c19a9e7f60f07245b))
  * count container top and bottom offset ([f8b71798](http://github.com/ajoslin/angular-scrolly/commit/f8b71798c7acfddf8dca6912f50245479ecdc358))
* **transformer:** Try both cases of transformProp (firefox, ie10) ([761f7c22](http://github.com/ajoslin/angular-scrolly/commit/761f7c22450c6c56cd96c079ec658ddcfcef3044))


#### Features

* **$scroller:** allow desktop scrolling ([8249eaf2](http://github.com/ajoslin/angular-scrolly/commit/8249eaf25049025a014e9439e8febb0b5e190100))
* **dragger:**
  * add option to stopPropagation, default false ([1ca592a6](http://github.com/ajoslin/angular-scrolly/commit/1ca592a6ebcf6428b9a81c82f6197fc532b27f08))
  * listen to mouse and touch, options to disable either ([87766439](http://github.com/ajoslin/angular-scrolly/commit/87766439c08ffa82ac5d9d94bbf4c893ab761db7))
  * Make addListener specify a dragDirection ([1506d03e](http://github.com/ajoslin/angular-scrolly/commit/1506d03ed5d6df81d5acdd279621928cfb13c913))
  * Give 2d x and y data instead of 1d ([559ea186](http://github.com/ajoslin/angular-scrolly/commit/559ea1861996a594e7bdbc0642e147fc29640ff0))
  * add horizontal option ([ddd75112](http://github.com/ajoslin/angular-scrolly/commit/ddd75112c88b3616f9d313d8ff233dcdbb2763f2))
* **scroller:** support mousewheel, keys ([a365debd](http://github.com/ajoslin/angular-scrolly/commit/a365debd03e7fafcc2fe83bc34d0fbdaebbe4074))
* **scrollyDraggerIgnore:** Add scrollyDraggerIgnore directive ([24dc1dbe](http://github.com/ajoslin/angular-scrolly/commit/24dc1dbe60fb1747231ee0812379b0f258ff3d48))
* **transformer:**
  * allow collection of elements to be transformed ([41373c57](http://github.com/ajoslin/angular-scrolly/commit/41373c57b678e4ec27e4d047fd857ab00096256a))
  * add clear() method to clear styles ([f4785491](http://github.com/ajoslin/angular-scrolly/commit/f4785491e843cc711c02cf6e15c7970b0bea5a1b))
  * allow user to only change x or y ([eeb702a7](http://github.com/ajoslin/angular-scrolly/commit/eeb702a7e4a2d4a00fa92de0f6dd39cb0f414faf))

<a name="v0.0.7"></a>
### v0.0.7 (2013-10-15)


#### Bug Fixes

* **desktop:**
  * Only scroll if vertical delta ([22bf70e0](http://github.com/ajoslin/angular-scrolly/commit/22bf70e018aa132294ad5f3d04a674b208aef024))
  * unbind keydown when scroll elm is destroyed ([51500ce9](http://github.com/ajoslin/angular-scrolly/commit/51500ce93087f5e62e84207e465722710afc3d17))

#### Features

* **$scroller:** allow desktop scrolling ([8249eaf2](http://github.com/ajoslin/angular-scrolly/commit/8249eaf25049025a014e9439e8febb0b5e190100))
* **dragger:**
  * add option to stopPropagation, default false ([1ca592a6](http://github.com/ajoslin/angular-scrolly/commit/1ca592a6ebcf6428b9a81c82f6197fc532b27f08))
* **transformer:**
  * allow collection of elements to be transformed ([41373c57](http://github.com/ajoslin/angular-scrolly/commit/41373c57b678e4ec27e4d047fd857ab00096256a))
  * add clear() method to clear styles ([f4785491](http://github.com/ajoslin/angular-scrolly/commit/f4785491e843cc711c02cf6e15c7970b0bea5a1b))
  * allow user to only change x or y ([eeb702a7](http://github.com/ajoslin/angular-scrolly/commit/eeb702a7e4a2d4a00fa92de0f6dd39cb0f414faf))

<a name="v0.0.6"></a>
### v0.0.6 (2013-10-06)

#### Bug Fixes

* **dragger:**
  * Let drag events propagate

#### Features

* **dragger:**
  * listen to mouse and touch, options to disable either ([87766439](http://github.com/ajoslin/angular-scrolly/commit/87766439c08ffa82ac5d9d94bbf4c893ab761db7))
  * Make addListener specify a dragDirection ([1506d03e](http://github.com/ajoslin/angular-scrolly/commit/1506d03ed5d6df81d5acdd279621928cfb13c913))
    - This is a breaking change.  To migrate your code, do the following:

    Change this:

    ```js
    var myDragger = $dragger(element, $dragger.DIRECTION_HORIZONTAL);
    myDragger.addListener(myListener);
    ```

    Into this:
    ```js
    var myDragger = $dragger(element);
    myDragger.addListener($dragger.DIRECTION_HORIZONTAL, element);
    ```

<a name="v0.0.5"></a>
### v0.0.5 (2013-09-30)


#### Bug Fixes


#### Features

* **dragger:**
  * Give 2d x and y data instead of 1d ([559ea186](http://github.com/ajoslin/angular-scrolly/commit/559ea1861996a594e7bdbc0642e147fc29640ff0))
  * If you use $dragger directly, the event data you receive and the usage has changed, see the documentation.


<a name="v0.0.4"></a>
### v0.0.4 (2013-08-13)


#### Bug Fixes

* **dragger:** stop propagation, so scroll on popups works ([2006b0bc](http://github.com/ajoslin/angular-scrolly/commit/2006b0bc658c78d4349ef718b860c557cd3a7e97))

<a name="v0.0.3"></a>
### v0.0.3 (2013-08-09)

#### Bug Fixes

* **desktop:** unbind keydown when scroll elm is destroyed ([51500ce9](http://github.com/ajoslin/angular-scrolly/commit/51500ce93087f5e62e84207e465722710afc3d17))
* **scroller:**
  * remove scroll event ([c8b170e2](http://github.com/ajoslin/angular-scrolly/commit/c8b170e29728d488ec4a312c19a9e7f60f07245b))
  * count container top and bottom offset ([f8b71798](http://github.com/ajoslin/angular-scrolly/commit/f8b71798c7acfddf8dca6912f50245479ecdc358))
* **transformer:** Try both cases of transformProp (firefox, ie10) ([761f7c22](http://github.com/ajoslin/angular-scrolly/commit/761f7c22450c6c56cd96c079ec658ddcfcef3044))


#### Features

* **$scroller:** allow desktop scrolling ([8249eaf2](http://github.com/ajoslin/angular-scrolly/commit/8249eaf25049025a014e9439e8febb0b5e190100))
* **dragger:** add horizontal option ([ddd75112](http://github.com/ajoslin/angular-scrolly/commit/ddd75112c88b3616f9d313d8ff233dcdbb2763f2))
* **scroller:** support mousewheel, keys ([a365debd](http://github.com/ajoslin/angular-scrolly/commit/a365debd03e7fafcc2fe83bc34d0fbdaebbe4074))

<a name="v0.0.2"></a>
### v0.0.2 (2013-07-30)

#### Bug Fixes

* **scroller**: count container top and bottom offset ([f8b71798](http://github.com/ajoslin/angular-scrolly/commit/f8b71798c7acfddf8dca6912f50245479ecdc358))
* **transformer:** Try both cases of transformProp (firefox, ie10 fix) ([761f7c22](http://github.com/ajoslin/angular-scrolly/commit/761f7c22450c6c56cd96c079ec658ddcfcef3044))

#### Features

* **$scroller:** allow desktop scrolling ([8249eaf2](http://github.com/ajoslin/angular-scrolly/commit/8249eaf25049025a014e9439e8febb0b5e190100))
* **scroller:** support mousewheel, keys ([a365debd](http://github.com/ajoslin/angular-scrolly/commit/a365debd03e7fafcc2fe83bc34d0fbdaebbe4074))
