# Changelog

## [2.0.0](https://github.com/netlify/netlify-plugin-gatsby/compare/v2.0.0-zz-beta.0...v2.0.0) (2022-01-31)


### ⚠ BREAKING CHANGES

* add support for Gatsby 4 render modes (#112)

### Features

* add support for custom error pages ([#244](https://github.com/netlify/netlify-plugin-gatsby/issues/244)) ([2396192](https://github.com/netlify/netlify-plugin-gatsby/commit/23961922aacb0f0bf72cb987615514baaabec16f))
* add support for Gatsby 4 render modes ([#112](https://github.com/netlify/netlify-plugin-gatsby/issues/112)) ([702b95e](https://github.com/netlify/netlify-plugin-gatsby/commit/702b95e91379c01a2353b3feabf9c596ce5c06db))
* append redirects, tidy up stuff ([0df95be](https://github.com/netlify/netlify-plugin-gatsby/commit/0df95be9476b2ae4992a813880539893844984da))
* change how handler is created ([#127](https://github.com/netlify/netlify-plugin-gatsby/issues/127)) ([dea5dae](https://github.com/netlify/netlify-plugin-gatsby/commit/dea5daea980ba909aaae5f9f8da02887c65e9867))
* check for conflicting plugins ([ab3402e](https://github.com/netlify/netlify-plugin-gatsby/commit/ab3402e7b53b802c7a42d0d4a74f98e9799c8e22))
* copy function wrappers to correct place on build ([72006cd](https://github.com/netlify/netlify-plugin-gatsby/commit/72006cdc1b8b1cd43408e532930af066aa18cadf))
* copying gatsby functions to netlify gatsby function directory ([ffd9940](https://github.com/netlify/netlify-plugin-gatsby/commit/ffd99409082ae8e3a2add98e19ccf98f71dac00c))
* handle large zipfiles ([#241](https://github.com/netlify/netlify-plugin-gatsby/issues/241)) ([af0ef8a](https://github.com/netlify/netlify-plugin-gatsby/commit/af0ef8a3633128744cb5434ed55762d6ce68892a))
* **package:** add package name to config files ([ea4a065](https://github.com/netlify/netlify-plugin-gatsby/commit/ea4a065a2846b81fffad7db0c37e22cf71ecd8cd))
* **plugin:** check gatsby for gatsby-plugin-netlify - log warning WHEN NOT ([690104a](https://github.com/netlify/netlify-plugin-gatsby/commit/690104ad7358641c42444b3596ffdddae3c8e4ae))
* **plugin:** pull over cache code from gatsby-cache plugin ([360194e](https://github.com/netlify/netlify-plugin-gatsby/commit/360194e042a208a0a134b6fe6a771ed457507de9))
* proxy functions during `ntl dev` ([#63](https://github.com/netlify/netlify-plugin-gatsby/issues/63)) ([0794831](https://github.com/netlify/netlify-plugin-gatsby/commit/079483174758a46bae206c158024e70fda9b63d1))
* show build status summary ([10f2f10](https://github.com/netlify/netlify-plugin-gatsby/commit/10f2f106f81c0c27abe029d038e6fe41df852a21))
* support disabling of Netlify function generation ([#240](https://github.com/netlify/netlify-plugin-gatsby/issues/240)) ([7587ddd](https://github.com/netlify/netlify-plugin-gatsby/commit/7587ddd9368d73c8c015d1be900abdba99e64ec3))
* support for node12, tracking gatsby node dep ([e799a82](https://github.com/netlify/netlify-plugin-gatsby/commit/e799a827519442a8ae6bbae02586ec3223419ea3))
* **test:** add test gatsby site from gatsby-functions plugin ([0cf296f](https://github.com/netlify/netlify-plugin-gatsby/commit/0cf296f4753a495a25e8027964b88b1f46a6fdfa))
* use esbuild for functions ([#55](https://github.com/netlify/netlify-plugin-gatsby/issues/55)) ([bb43ccb](https://github.com/netlify/netlify-plugin-gatsby/commit/bb43ccbff7bac42005e4fdfbbc6f63db6b5bf4ed))
* use internal functions dir ([#91](https://github.com/netlify/netlify-plugin-gatsby/issues/91)) ([fa25e6d](https://github.com/netlify/netlify-plugin-gatsby/commit/fa25e6dd2fa390da6b64a46846b7aee4ca30c1e6))


### Bug Fixes

* add .nvmrc for node build version ([92856c0](https://github.com/netlify/netlify-plugin-gatsby/commit/92856c09ef923f70e0822806d46924f582090442))
* add redirects to publish directory ([aa59369](https://github.com/netlify/netlify-plugin-gatsby/commit/aa5936984c77f86ba2b461767ffadfeb99bf1294))
* allow functions to overwrite ([2974725](https://github.com/netlify/netlify-plugin-gatsby/commit/2974725fbd120548f01af1245742e14ccb52d3e8))
* conditionally proxy dev functions ([#92](https://github.com/netlify/netlify-plugin-gatsby/issues/92)) ([501c525](https://github.com/netlify/netlify-plugin-gatsby/commit/501c5256d76494f13f83c8bf42b63763dea6bf07))
* config fixed and removed extra files ([155cd4a](https://github.com/netlify/netlify-plugin-gatsby/commit/155cd4af05528deda59b754a6c2bd8348dfeb787))
* correct package locks ([1bfe553](https://github.com/netlify/netlify-plugin-gatsby/commit/1bfe55324bfab15d7f1c64d87504c47c9a6dd600))
* correctly install plugin deps before building site ([6e7ff6c](https://github.com/netlify/netlify-plugin-gatsby/commit/6e7ff6c2bdfd8575d7af23cac47832e194b58586))
* **demo:** correct plugin name ([20a1fc2](https://github.com/netlify/netlify-plugin-gatsby/commit/20a1fc251aa60ab183b6b350420378f3c0aad68e))
* **deps:** update dependency @netlify/functions to ^0.10.0 ([#187](https://github.com/netlify/netlify-plugin-gatsby/issues/187)) ([95dd1de](https://github.com/netlify/netlify-plugin-gatsby/commit/95dd1de97ea211bc1fa11d92d18314b47b75284c))
* **deps:** update dependency @netlify/functions to ^0.11.0 ([#234](https://github.com/netlify/netlify-plugin-gatsby/issues/234)) ([0339490](https://github.com/netlify/netlify-plugin-gatsby/commit/033949098ac35a2f990cbea2dc735e491a4fe5d0))
* **deps:** update dependency @netlify/functions to ^0.8.0 ([#154](https://github.com/netlify/netlify-plugin-gatsby/issues/154)) ([ac2adb3](https://github.com/netlify/netlify-plugin-gatsby/commit/ac2adb3a4f2f20da7f22d8fb61486e645322d7b1))
* **deps:** update dependency @netlify/functions to ^0.9.0 ([#180](https://github.com/netlify/netlify-plugin-gatsby/issues/180)) ([ae2c1d1](https://github.com/netlify/netlify-plugin-gatsby/commit/ae2c1d12d915165d8c296d981c5cc55b0e9a77d7))
* **deps:** update dependency multer to v1.4.4 ([#205](https://github.com/netlify/netlify-plugin-gatsby/issues/205)) ([1fb1144](https://github.com/netlify/netlify-plugin-gatsby/commit/1fb1144d7e5b28c8c37a03158e94b5eb52864c9a))
* **deps:** update dependency node-fetch to v2.6.2 ([#110](https://github.com/netlify/netlify-plugin-gatsby/issues/110)) ([e7a6f8d](https://github.com/netlify/netlify-plugin-gatsby/commit/e7a6f8d4768ae22a470273e052334d699a8912c8))
* **deps:** update dependency node-fetch to v2.6.6 ([#157](https://github.com/netlify/netlify-plugin-gatsby/issues/157)) ([36221b5](https://github.com/netlify/netlify-plugin-gatsby/commit/36221b5ba3150d88efa6c7378c4926cd822125c9))
* **deps:** update dependency node-fetch to v2.6.7 ([#228](https://github.com/netlify/netlify-plugin-gatsby/issues/228)) ([ca2066a](https://github.com/netlify/netlify-plugin-gatsby/commit/ca2066afc8ad21bd22b2207fec19f095f26cd4fa))
* **deps:** update dependency path-to-regexp to ^0.2.0 ([#36](https://github.com/netlify/netlify-plugin-gatsby/issues/36)) ([66bddd4](https://github.com/netlify/netlify-plugin-gatsby/commit/66bddd4de9bcc64a7fead1524f5c65e16b6ab995))
* **deps:** update dependency path-to-regexp to v6 ([#38](https://github.com/netlify/netlify-plugin-gatsby/issues/38)) ([4504094](https://github.com/netlify/netlify-plugin-gatsby/commit/45040947be5e66dec8b652f77f96e476f466c5b5))
* **deps:** update dependency tempy to v1 ([#39](https://github.com/netlify/netlify-plugin-gatsby/issues/39)) ([ea225a8](https://github.com/netlify/netlify-plugin-gatsby/commit/ea225a8b7e7ee5d18f3b0dc338c780ba5d223301))
* don't break for sites without functions enabled ([4c921b9](https://github.com/netlify/netlify-plugin-gatsby/commit/4c921b91793353f37c3a663df1391033294c72ea))
* don't try and parse get/head body ([a67eab1](https://github.com/netlify/netlify-plugin-gatsby/commit/a67eab178690bef8bd2bf33a4f618ef26054cb02))
* ensure cache/json exists ([#124](https://github.com/netlify/netlify-plugin-gatsby/issues/124)) ([8e8247b](https://github.com/netlify/netlify-plugin-gatsby/commit/8e8247bf8051fb7814077f427338de24cdf28c10))
* generate handlers with correct site root ([#235](https://github.com/netlify/netlify-plugin-gatsby/issues/235)) ([d7b92a1](https://github.com/netlify/netlify-plugin-gatsby/commit/d7b92a199e09331b29ceaf895cffc2f804e6082e))
* get uploads working ([fbe16c9](https://github.com/netlify/netlify-plugin-gatsby/commit/fbe16c9a9d2e271065f31795f4ff805dfa06398d))
* handle config file splicing ([4b07cb9](https://github.com/netlify/netlify-plugin-gatsby/commit/4b07cb9715edcfba763e3398096e523c0c6f4076))
* handle custom functions dir ([#58](https://github.com/netlify/netlify-plugin-gatsby/issues/58)) ([01e58a8](https://github.com/netlify/netlify-plugin-gatsby/commit/01e58a8c381c8ac52fe9f503434cf8400b50ba3e))
* handle missing gatsby-config or plugins array ([a691a42](https://github.com/netlify/netlify-plugin-gatsby/commit/a691a42601835d5a9ca76e9cabc782cd5af35bf6))
* handle null plugin entries ([#84](https://github.com/netlify/netlify-plugin-gatsby/issues/84)) ([8a69d5c](https://github.com/netlify/netlify-plugin-gatsby/commit/8a69d5cf504fadf53f17f8e50a92a76714f00084))
* link test site ([187c303](https://github.com/netlify/netlify-plugin-gatsby/commit/187c303d91c1baed3f42ef8cb813dfd4dd33383d))
* newlines before inserts and check for string before insert ([c70ab33](https://github.com/netlify/netlify-plugin-gatsby/commit/c70ab33e8df62573d13dd489bb615872a3194e3d))
* package script TRYING STUFF ([c75925a](https://github.com/netlify/netlify-plugin-gatsby/commit/c75925ac7bdb020199965f088b286324ffb5af18))
* pathtoregexp import ([fdacbf5](https://github.com/netlify/netlify-plugin-gatsby/commit/fdacbf5376ad07ca487635aad808da76a49f77fe))
* pushd is bash ([53cc718](https://github.com/netlify/netlify-plugin-gatsby/commit/53cc718a1563445196b0715af426231af9cfcd1f))
* rebuild package-lock with verified/clean cache ([90010d5](https://github.com/netlify/netlify-plugin-gatsby/commit/90010d503948442455a570e70624629375525bc5))
* remove generated files ([b601fe6](https://github.com/netlify/netlify-plugin-gatsby/commit/b601fe6dbef648c0b2466dab5566ae00ae130551))
* remove logs in spliceconfig ([df21001](https://github.com/netlify/netlify-plugin-gatsby/commit/df210018d23deaceff61e1dfe4b1c8a324c8df56))
* remove node version from toml ([930d1ff](https://github.com/netlify/netlify-plugin-gatsby/commit/930d1ffd4e3e08e0cd992d32dd71eff892ab2102))
* remove package-lock from publishable package ([6a081ed](https://github.com/netlify/netlify-plugin-gatsby/commit/6a081ed90efc383f8abc6a72f0a5e7941934fca9))
* run npm ci in plugin dir ([e708319](https://github.com/netlify/netlify-plugin-gatsby/commit/e7083199f815ec2da195d8c5af45ed668a8320e7))
* track package-lock in test build ([44d29a6](https://github.com/netlify/netlify-plugin-gatsby/commit/44d29a633de281fe03746c359307269ececc981e))
* try reordering the install script ([39599f6](https://github.com/netlify/netlify-plugin-gatsby/commit/39599f6306c22437b2918a24699fde22186ad5a8))
* update path parsing to match Gatsby ([#232](https://github.com/netlify/netlify-plugin-gatsby/issues/232)) ([48f41ce](https://github.com/netlify/netlify-plugin-gatsby/commit/48f41ce7e953d7a09ef89177ec2a6cfd91d9ea76))
* use offline build instead of fake token ([#82](https://github.com/netlify/netlify-plugin-gatsby/issues/82)) ([5395ca1](https://github.com/netlify/netlify-plugin-gatsby/commit/5395ca13ad22ca8a0c2e41748f0119e708860540))


### Miscellaneous Chores

* **deps:** update dependency ava to v4 ([#222](https://github.com/netlify/netlify-plugin-gatsby/issues/222)) ([3e12e4e](https://github.com/netlify/netlify-plugin-gatsby/commit/3e12e4eee448f5b534319c9da8f7509d97ee4294))
