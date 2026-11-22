# Роҳ ба сӯи маърифат

React-интерфейс для существующего Django REST API. Язык сайта — таджикский.

Запускайте Django и frontend в двух окнах PowerShell.

В первом окне:

```powershell
Set-Location 'D:\softclub\django-drf\quiz'
.\.myvenv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Во втором окне:

```powershell
Set-Location 'D:\softclub\django-drf\quiz\frontend'
npm ci
npm run dev
```

Откройте http://127.0.0.1:5173/ и войдите своей учётной записью Django. До входа каталог показывает учебные примеры. После входа курсы, задачи и попытки загружаются из базы Django. Учётной записи с правами администратора доступен раздел «Идоракунӣ».

Vite пересылает запросы API локальному Django. Если Django работает на другом порту, укажите адрес в файле `.env.local` внутри этой папки, например `DJANGO_ORIGIN=http://127.0.0.1:8001`. Для проверки собранной версии выполните `npm run build` и `npm run preview`.

## Python Judge 3D

Откройте любую Python-задачу. Сцены начинаются после ответа API. Первая и вторая подряд попытки `wrong_answer` запускают одно и два виртуальных столкновения соответственно. Третья и последующие запускают финал с фантастическим реквизитом. `accepted` сбрасывает счётчик. Ошибки выполнения, тайм-ауты и сбои запросов счётчик не меняют. Счётчик хранится отдельно для каждой пары «пользователь и задача» в текущей вкладке.

В карточке можно отключить эффекты или включить звук, который по умолчанию выключен. Сцену можно пропустить кнопкой или Escape. Настройка `prefers-reduced-motion` отключает движение и полноэкранные сцены. При недоступном WebGL проверка остаётся доступной с текстовым вердиктом.

В карточке используется текстурированная модель со скелетом. На лёгком режиме рендерер снижает частоту и разрешение, отключает тени и динамическое размытие. У модели нет отдельного лицевого рига, поэтому мимика и взгляд ограничены позой головы и корпуса. Источники и лицензии моделей перечислены в `public/judge/ASSETS.md`.

Иллюстрация первого экрана сохранена в `public/hero.png` и создана встроенным ImageGen по следующему запросу:

> Use case: stylized-concept. Asset type: wide background artwork for a modern coding education dashboard hero. Make a premium editorial 3D still life: an open oversized book with gently curved ivory and pale lavender pages, one small glossy amber orange angular block, lavender geometric steps, and a rich violet orbital path or thin ring, all composing one clear silhouette against a seamless near-black midnight indigo studio set (#181629). The book and shapes are entirely on the rightmost 50 percent of a wide 2:1 composition; left 45 percent must be plain, very dark and empty for live HTML headline, with no visible line or seam. A gentle warm light illuminates book and orange accent, subtle violet spot lighting adds dimensionality. Slight elevated three-quarter view, tight elegant grouping of objects, not a visual metaphor collage. Contemporary tactile material, restrained palette, artsy high-end product photography feel, high contrast for dark hero. No typography, no text, no letters, no interface elements, no logos, no watermark, no people. Landscape.
