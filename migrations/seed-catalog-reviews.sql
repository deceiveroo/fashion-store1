-- ============================================================================
-- ELEVATE Fashion Store — наполнение каталога: 40 товаров, 40 пользователей,
-- 125 уникальных отзывов. Всё правдоподобно и взаимосвязано.
--
-- Как применить: Supabase → SQL Editor → New query → вставить → Run.
-- Скрипт ИДЕМПОТЕНТЕН (ON CONFLICT DO NOTHING) — можно запускать повторно.
-- Ничего не удаляет: только добавляет новые id (elevate-w-1xx / elevate-m-1xx,
-- user-0xx, rev-xxx), которые не конфликтуют с существующим каталогом.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. КАТЕГОРИИ (используем те же id, что и витрина /women /men /new /collections)
-- ============================================================================
INSERT INTO categories (id, name, slug, description, is_active, sort_order, locale)
VALUES
  ('women',       'Женское',   'zhenskoe',   'Женская коллекция ELEVATE', true, 1, 'ru'),
  ('men',         'Мужское',   'muzhskoe',   'Мужская коллекция ELEVATE', true, 2, 'ru'),
  ('new',         'Новинки',   'novinki',    'Новые поступления',         true, 3, 'ru'),
  ('collections', 'Коллекции', 'kollektsii', 'Избранные подборки',        true, 4, 'ru')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ТОВАРЫ (40 шт., все разные). Фото — picsum (стабильные seed-URL).
--    images заполняется inline-массивом; дублируется в product_images ниже.
-- ============================================================================
INSERT INTO products (
  id, name, slug, sku, description, short_description, price, compare_at_price,
  stock, category_id, brand, country, composition, color,
  in_stock, featured, is_featured, is_new, is_active, is_sale, tags, images,
  created_at, updated_at
) VALUES
-- ── ЖЕНСКОЕ ───────────────────────────────────────────────────────────────
('elevate-w-101','Платье миди «Aurora Satin»','dress-aurora-satin','ELV-W-101',
 'Атласное платье миди на тонких бретелях с косым кроем. Струящаяся ткань красиво садится по фигуре, подойдёт для вечера и торжества.',
 'Атласное платье миди с косым кроем',7990,9990,26,'women','ELEVATE','Китай','100% полиэстер (атлас)','Изумрудный',
 true,true,true,true,true,true,ARRAY['вечернее','хит'],ARRAY['https://picsum.photos/seed/elevate-w-101/800/1000','https://picsum.photos/seed/elevate-w-101b/800/1000'],
 NOW() - INTERVAL '46 days', NOW()),
('elevate-w-102','Платье макси «Riviera»','dress-maxi-riviera','ELV-W-102',
 'Лёгкое летнее платье макси из вискозы с цветочным принтом и поясом на талии. Дышащая ткань для жаркой погоды.',
 'Летнее платье макси с принтом',6490,NULL,31,'women','ELEVATE','Бангладеш','100% вискоза','Цветочный принт',
 true,false,false,true,true,false,ARRAY['лето','новинка'],ARRAY['https://picsum.photos/seed/elevate-w-102/800/1000','https://picsum.photos/seed/elevate-w-102b/800/1000'],
 NOW() - INTERVAL '20 days', NOW()),
('elevate-w-103','Блузка «Silk Whisper»','blouse-silk-whisper','ELV-W-103',
 'Шёлковая блузка свободного кроя с мягким блеском и потайными пуговицами. Базовая вещь для офиса и выхода.',
 'Шёлковая блузка свободного кроя',5990,NULL,22,'women','ELEVATE','Италия','94% шёлк, 6% эластан','Молочный',
 true,true,true,false,true,false,ARRAY['офис','базовое'],ARRAY['https://picsum.photos/seed/elevate-w-103/800/1000','https://picsum.photos/seed/elevate-w-103b/800/1000'],
 NOW() - INTERVAL '60 days', NOW()),
('elevate-w-104','Юбка-плиссе «Metallic»','skirt-pleated-metallic','ELV-W-104',
 'Плиссированная юбка миди с лёгким металлическим отливом. Держит складку и хорошо комбинируется с трикотажем.',
 'Плиссированная юбка миди',4490,5490,18,'women','ELEVATE','Турция','100% полиэстер','Серебристый',
 true,false,false,false,true,true,ARRAY['вечернее'],ARRAY['https://picsum.photos/seed/elevate-w-104/800/1000','https://picsum.photos/seed/elevate-w-104b/800/1000'],
 NOW() - INTERVAL '38 days', NOW()),
('elevate-w-105','Джинсы mom «Vintage Blue»','jeans-mom-vintage-blue','ELV-W-105',
 'Джинсы mom с завышенной талией из плотного денима. Свободные по бедру и зауженные к низу — винтажный силуэт.',
 'Джинсы mom с высокой посадкой',4990,NULL,40,'women','ELEVATE','Китай','98% хлопок, 2% эластан','Синий',
 true,false,false,false,true,false,ARRAY['деним','базовое'],ARRAY['https://picsum.photos/seed/elevate-w-105/800/1000','https://picsum.photos/seed/elevate-w-105b/800/1000'],
 NOW() - INTERVAL '52 days', NOW()),
('elevate-w-106','Тренч «Classic Beige»','trench-classic-beige','ELV-W-106',
 'Классический тренч с поясом, двубортной застёжкой и кокеткой. Лёгкая водоотталкивающая ткань для межсезонья.',
 'Классический бежевый тренч',11990,NULL,15,'women','ELEVATE','Китай','65% хлопок, 35% полиэстер','Бежевый',
 true,false,false,false,true,false,ARRAY['демисезон'],ARRAY['https://picsum.photos/seed/elevate-w-106/800/1000','https://picsum.photos/seed/elevate-w-106b/800/1000'],
 NOW() - INTERVAL '70 days', NOW()),
('elevate-w-107','Пальто «Camel Wool»','coat-camel-wool','ELV-W-107',
 'Шерстяное пальто прямого кроя цвета кэмел, длина миди. Тёплое, с подкладкой и боковыми карманами.',
 'Шерстяное пальто цвета кэмел',16990,19990,12,'women','ELEVATE','Китай','70% шерсть, 30% полиэстер','Кэмел',
 true,true,true,true,true,true,ARRAY['зима','хит'],ARRAY['https://picsum.photos/seed/elevate-w-107/800/1000','https://picsum.photos/seed/elevate-w-107b/800/1000'],
 NOW() - INTERVAL '34 days', NOW()),
('elevate-w-108','Свитер оверсайз «Cloud Knit»','sweater-cloud-knit','ELV-W-108',
 'Объёмный свитер крупной вязки с приспущенным плечом. Мягкая пряжа с добавлением шерсти, очень уютный.',
 'Объёмный свитер крупной вязки',4990,NULL,28,'women','ELEVATE','Китай','50% акрил, 30% шерсть, 20% нейлон','Бежевый',
 true,false,false,false,true,false,ARRAY['зима','уют'],ARRAY['https://picsum.photos/seed/elevate-w-108/800/1000','https://picsum.photos/seed/elevate-w-108b/800/1000'],
 NOW() - INTERVAL '25 days', NOW()),
('elevate-w-109','Костюм брючный «Power Suit»','suit-power-women','ELV-W-109',
 'Брючный костюм: жакет на подкладке и прямые брюки со стрелками. Строгий силуэт для деловых образов.',
 'Брючный костюм (жакет + брюки)',13990,NULL,14,'women','ELEVATE','Турция','63% полиэстер, 33% вискоза, 4% эластан','Графитовый',
 true,false,false,false,true,false,ARRAY['офис'],ARRAY['https://picsum.photos/seed/elevate-w-109/800/1000','https://picsum.photos/seed/elevate-w-109b/800/1000'],
 NOW() - INTERVAL '41 days', NOW()),
('elevate-w-110','Платье-комбинация «Slip Noir»','dress-slip-noir','ELV-W-110',
 'Платье-комбинация длины миди на тонких бретелях. Универсальная база — носится самостоятельно или с водолазкой.',
 'Платье-комбинация миди',4290,NULL,24,'women','ELEVATE','Китай','100% вискоза','Чёрный',
 true,false,false,false,true,false,ARRAY['базовое'],ARRAY['https://picsum.photos/seed/elevate-w-110/800/1000','https://picsum.photos/seed/elevate-w-110b/800/1000'],
 NOW() - INTERVAL '29 days', NOW()),
('elevate-w-111','Кардиган «Cozy Mohair»','cardigan-cozy-mohair','ELV-W-111',
 'Мягкий кардиган из мохеровой пряжи на пуговицах. Лёгкий пушок и приятная фактура, греет в прохладу.',
 'Мягкий мохеровый кардиган',5490,NULL,20,'women','ELEVATE','Китай','40% мохер, 35% акрил, 25% полиамид','Пудровый',
 true,false,false,false,true,false,ARRAY['уют'],ARRAY['https://picsum.photos/seed/elevate-w-111/800/1000','https://picsum.photos/seed/elevate-w-111b/800/1000'],
 NOW() - INTERVAL '18 days', NOW()),
('elevate-w-112','Топ «Basic Rib»','top-basic-rib','ELV-W-112',
 'Базовый топ в рубчик с тонкими бретелями. Эластичный материал хорошо тянется и держит форму.',
 'Базовый топ в рубчик',1490,NULL,55,'women','ELEVATE','Узбекистан','95% хлопок, 5% эластан','Белый',
 true,false,false,false,true,false,ARRAY['базовое'],ARRAY['https://picsum.photos/seed/elevate-w-112/800/1000','https://picsum.photos/seed/elevate-w-112b/800/1000'],
 NOW() - INTERVAL '15 days', NOW()),
('elevate-w-113','Жакет «Tweed Line»','jacket-tweed-line','ELV-W-113',
 'Твидовый жакет в классическом стиле с золотистыми пуговицами и окантовкой. Аккуратный крой по фигуре.',
 'Твидовый жакет с окантовкой',9490,NULL,16,'women','ELEVATE','Китай','60% хлопок, 25% полиэстер, 15% акрил','Молочный',
 true,false,true,false,true,false,ARRAY['офис','вечернее'],ARRAY['https://picsum.photos/seed/elevate-w-113/800/1000','https://picsum.photos/seed/elevate-w-113b/800/1000'],
 NOW() - INTERVAL '44 days', NOW()),
('elevate-w-114','Леггинсы «Active Flex»','leggings-active-flex','ELV-W-114',
 'Спортивные леггинсы с высокой посадкой и компрессией. Не просвечивают на наклоне, остаются на месте.',
 'Спортивные леггинсы с компрессией',2990,NULL,42,'women','ELEVATE','Вьетнам','78% полиамид, 22% эластан','Чёрный',
 true,false,false,false,true,false,ARRAY['спорт'],ARRAY['https://picsum.photos/seed/elevate-w-114/800/1000','https://picsum.photos/seed/elevate-w-114b/800/1000'],
 NOW() - INTERVAL '22 days', NOW()),
('elevate-w-115','Рубашка «Poplin White»','shirt-poplin-white','ELV-W-115',
 'Хлопковая рубашка из поплина прямого кроя. Чёткая линия воротника, держит вид после стирки.',
 'Хлопковая рубашка из поплина',3490,NULL,30,'women','ELEVATE','Бангладеш','100% хлопок','Белый',
 true,false,false,false,true,false,ARRAY['офис','базовое'],ARRAY['https://picsum.photos/seed/elevate-w-115/800/1000','https://picsum.photos/seed/elevate-w-115b/800/1000'],
 NOW() - INTERVAL '33 days', NOW()),
('elevate-w-116','Платье-свитер «Knit Midi»','dress-knit-midi','ELV-W-116',
 'Тёплое трикотажное платье миди с воротником-гольф. Облегает мягко, не сковывает движения.',
 'Трикотажное платье-свитер миди',5790,NULL,19,'women','ELEVATE','Китай','55% вискоза, 30% полиэстер, 15% полиамид','Серый меланж',
 true,false,false,true,true,false,ARRAY['зима','новинка'],ARRAY['https://picsum.photos/seed/elevate-w-116/800/1000','https://picsum.photos/seed/elevate-w-116b/800/1000'],
 NOW() - INTERVAL '12 days', NOW()),
('elevate-w-117','Шорты «Linen Summer»','shorts-linen-summer','ELV-W-117',
 'Льняные шорты с завышенной талией и поясом на резинке сзади. Лёгкие и дышащие для лета.',
 'Льняные шорты с высокой посадкой',2790,NULL,26,'women','ELEVATE','Турция','55% лён, 45% вискоза','Песочный',
 true,false,false,false,true,false,ARRAY['лето'],ARRAY['https://picsum.photos/seed/elevate-w-117/800/1000','https://picsum.photos/seed/elevate-w-117b/800/1000'],
 NOW() - INTERVAL '48 days', NOW()),
('elevate-w-118','Куртка джинсовая «Denim Crop»','jacket-denim-crop','ELV-W-118',
 'Укороченная джинсовая куртка из плотного денима. Классические карманы и металлические пуговицы.',
 'Укороченная джинсовая куртка',5290,NULL,23,'women','ELEVATE','Китай','100% хлопок','Голубой',
 true,false,false,false,true,false,ARRAY['деним','демисезон'],ARRAY['https://picsum.photos/seed/elevate-w-118/800/1000','https://picsum.photos/seed/elevate-w-118b/800/1000'],
 NOW() - INTERVAL '27 days', NOW()),
('elevate-w-119','Юбка-карандаш «Office Line»','skirt-pencil-office','ELV-W-119',
 'Юбка-карандаш длины миди с разрезом сзади. Плотная костюмная ткань, классический силуэт.',
 'Юбка-карандаш для офиса',3690,NULL,21,'women','ELEVATE','Турция','64% полиэстер, 32% вискоза, 4% эластан','Чёрный',
 true,false,false,false,true,false,ARRAY['офис'],ARRAY['https://picsum.photos/seed/elevate-w-119/800/1000','https://picsum.photos/seed/elevate-w-119b/800/1000'],
 NOW() - INTERVAL '36 days', NOW()),
('elevate-w-120','Боди «Second Skin»','bodysuit-second-skin','ELV-W-120',
 'Бесшовное боди с длинным рукавом и кнопками снизу. Плотно сидит, не задирается под одеждой.',
 'Бесшовное боди с длинным рукавом',2490,NULL,34,'women','ELEVATE','Вьетнам','92% полиамид, 8% эластан','Бежевый',
 true,false,false,false,true,false,ARRAY['базовое'],ARRAY['https://picsum.photos/seed/elevate-w-120/800/1000','https://picsum.photos/seed/elevate-w-120b/800/1000'],
 NOW() - INTERVAL '19 days', NOW()),
('elevate-w-121','Пуховик «Arctic Glow»','puffer-arctic-glow','ELV-W-121',
 'Длинный пуховик с капюшоном на натуральном пуху. Утеплён для морозов, есть внутренние карманы.',
 'Длинный зимний пуховик',18990,22990,11,'women','ELEVATE','Китай','Верх 100% полиэстер; наполнитель 80% пух, 20% перо','Чёрный',
 true,true,true,true,true,true,ARRAY['зима','хит'],ARRAY['https://picsum.photos/seed/elevate-w-121/800/1000','https://picsum.photos/seed/elevate-w-121b/800/1000'],
 NOW() - INTERVAL '31 days', NOW()),
('elevate-w-122','Сарафан «Floral Garden»','sundress-floral-garden','ELV-W-122',
 'Сарафан на пуговицах с цветочным принтом и открытыми плечами. Лёгкая ткань, расклешённая юбка.',
 'Сарафан с цветочным принтом',4690,NULL,27,'women','ELEVATE','Бангладеш','100% вискоза','Цветочный принт',
 true,false,false,true,true,false,ARRAY['лето','новинка'],ARRAY['https://picsum.photos/seed/elevate-w-122/800/1000','https://picsum.photos/seed/elevate-w-122b/800/1000'],
 NOW() - INTERVAL '23 days', NOW()),
-- ── МУЖСКОЕ ───────────────────────────────────────────────────────────────
('elevate-m-101','Футболка «Pima Cotton Tee»','tee-pima-cotton','ELV-M-101',
 'Базовая футболка из хлопка пима с плотным, но мягким полотном. Не теряет форму после стирок.',
 'Базовая футболка из хлопка пима',1790,NULL,60,'men','ELEVATE','Узбекистан','100% хлопок (пима)','Белый',
 true,false,false,false,true,false,ARRAY['базовое'],ARRAY['https://picsum.photos/seed/elevate-m-101/800/1000','https://picsum.photos/seed/elevate-m-101b/800/1000'],
 NOW() - INTERVAL '55 days', NOW()),
('elevate-m-102','Рубашка «Oxford Classic»','shirt-oxford-classic','ELV-M-102',
 'Рубашка из оксфордского хлопка прямого кроя с воротником на пуговицах. Универсальна — от офиса до casual.',
 'Рубашка из оксфордского хлопка',3990,NULL,33,'men','ELEVATE','Бангладеш','100% хлопок (оксфорд)','Голубой',
 true,false,false,false,true,false,ARRAY['офис','базовое'],ARRAY['https://picsum.photos/seed/elevate-m-102/800/1000','https://picsum.photos/seed/elevate-m-102b/800/1000'],
 NOW() - INTERVAL '49 days', NOW()),
('elevate-m-103','Джинсы slim «Raw Denim»','jeans-slim-raw','ELV-M-103',
 'Зауженные джинсы из сырого денима с минимальной обработкой. Со временем приобретают индивидуальные заломы.',
 'Зауженные джинсы из сырого денима',5490,NULL,38,'men','ELEVATE','Китай','99% хлопок, 1% эластан','Тёмно-синий',
 true,false,false,false,true,false,ARRAY['деним'],ARRAY['https://picsum.photos/seed/elevate-m-103/800/1000','https://picsum.photos/seed/elevate-m-103b/800/1000'],
 NOW() - INTERVAL '43 days', NOW()),
('elevate-m-104','Худи «Heavyweight Fleece»','hoodie-heavyweight','ELV-M-104',
 'Плотное худи на флисе плотностью 400 г/м² с начёсом. Тяжёлое полотно, капюшон в два слоя.',
 'Плотное худи на флисе 400 г/м²',4490,NULL,36,'men','ELEVATE','Китай','80% хлопок, 20% полиэстер','Графитовый',
 true,true,true,true,true,false,ARRAY['базовое','хит'],ARRAY['https://picsum.photos/seed/elevate-m-104/800/1000','https://picsum.photos/seed/elevate-m-104b/800/1000'],
 NOW() - INTERVAL '17 days', NOW()),
('elevate-m-105','Куртка-бомбер «MA-1»','jacket-bomber-ma1','ELV-M-105',
 'Классический бомбер MA-1 с рёбрами на манжетах и кармашком на рукаве. Лёгкий утеплитель для демисезона.',
 'Классический бомбер MA-1',6990,NULL,24,'men','ELEVATE','Китай','100% нейлон; подкладка 100% полиэстер','Хаки',
 true,false,false,true,true,false,ARRAY['демисезон','новинка'],ARRAY['https://picsum.photos/seed/elevate-m-105/800/1000','https://picsum.photos/seed/elevate-m-105b/800/1000'],
 NOW() - INTERVAL '14 days', NOW()),
('elevate-m-106','Пальто «Wool Crombie»','coat-wool-crombie','ELV-M-106',
 'Однобортное шерстяное пальто прямого силуэта длиной до колена. Строгое и тёплое, с боковыми карманами.',
 'Шерстяное пальто кромби',15990,NULL,13,'men','ELEVATE','Китай','75% шерсть, 25% полиэстер','Тёмно-синий',
 true,false,true,false,true,false,ARRAY['зима','офис'],ARRAY['https://picsum.photos/seed/elevate-m-106/800/1000','https://picsum.photos/seed/elevate-m-106b/800/1000'],
 NOW() - INTERVAL '39 days', NOW()),
('elevate-m-107','Свитшот «Loopback»','sweatshirt-loopback','ELV-M-107',
 'Свитшот из футера петля прямого кроя. Дышащее полотно без начёса — комфортно круглый год.',
 'Свитшот из футера петля',3290,NULL,41,'men','ELEVATE','Узбекистан','100% хлопок (футер)','Серый меланж',
 true,false,false,false,true,false,ARRAY['базовое'],ARRAY['https://picsum.photos/seed/elevate-m-107/800/1000','https://picsum.photos/seed/elevate-m-107b/800/1000'],
 NOW() - INTERVAL '28 days', NOW()),
('elevate-m-108','Чиносы «Stretch Cotton»','chinos-stretch','ELV-M-108',
 'Чиносы из хлопка с эластаном, прямой крой. Аккуратно смотрятся и не стесняют движений.',
 'Чиносы из хлопка со стрейчем',3790,NULL,35,'men','ELEVATE','Китай','97% хлопок, 3% эластан','Бежевый',
 true,false,false,false,true,false,ARRAY['базовое','офис'],ARRAY['https://picsum.photos/seed/elevate-m-108/800/1000','https://picsum.photos/seed/elevate-m-108b/800/1000'],
 NOW() - INTERVAL '37 days', NOW()),
('elevate-m-109','Пуховик «Alpine Down»','puffer-alpine-down','ELV-M-109',
 'Зимний пуховик с капюшоном и натуральным наполнителем. Тёплый и лёгкий, ветрозащитная мембрана.',
 'Зимний пуховик с капюшоном',17490,20990,12,'men','ELEVATE','Китай','Верх 100% полиэстер; наполнитель 90% пух, 10% перо','Чёрный',
 true,false,false,true,true,true,ARRAY['зима','новинка'],ARRAY['https://picsum.photos/seed/elevate-m-109/800/1000','https://picsum.photos/seed/elevate-m-109b/800/1000'],
 NOW() - INTERVAL '21 days', NOW()),
('elevate-m-110','Поло «Pique Polo»','polo-pique','ELV-M-110',
 'Поло из пике с классическим воротником и планкой на пуговицах. Хорошо держит форму, не мнётся.',
 'Поло из хлопкового пике',2490,NULL,44,'men','ELEVATE','Бангладеш','100% хлопок (пике)','Тёмно-синий',
 true,false,false,false,true,false,ARRAY['лето','базовое'],ARRAY['https://picsum.photos/seed/elevate-m-110/800/1000','https://picsum.photos/seed/elevate-m-110b/800/1000'],
 NOW() - INTERVAL '50 days', NOW()),
('elevate-m-111','Костюм «Slim Navy Suit»','suit-slim-navy','ELV-M-111',
 'Приталенный костюм тёмно-синего цвета: пиджак на две пуговицы и брюки. Костюмная ткань с лёгким стрейчем.',
 'Приталенный костюм (пиджак + брюки)',16990,NULL,10,'men','ELEVATE','Турция','70% полиэстер, 28% вискоза, 2% эластан','Тёмно-синий',
 true,false,true,false,true,false,ARRAY['офис','вечернее'],ARRAY['https://picsum.photos/seed/elevate-m-111/800/1000','https://picsum.photos/seed/elevate-m-111b/800/1000'],
 NOW() - INTERVAL '42 days', NOW()),
('elevate-m-112','Кардиган «Shawl Collar»','cardigan-shawl-collar','ELV-M-112',
 'Тёплый кардиган с воротником-шалькой на пуговицах. Плотная вязка с шерстью, согреет в холода.',
 'Кардиган с воротником-шалькой',5990,NULL,18,'men','ELEVATE','Китай','55% акрил, 30% шерсть, 15% полиамид','Тёмно-серый',
 true,false,false,false,true,false,ARRAY['зима','уют'],ARRAY['https://picsum.photos/seed/elevate-m-112/800/1000','https://picsum.photos/seed/elevate-m-112b/800/1000'],
 NOW() - INTERVAL '32 days', NOW()),
('elevate-m-113','Шорты «Cargo Utility»','shorts-cargo-utility','ELV-M-113',
 'Шорты карго с накладными карманами из плотного хлопка. Практичные, свободный крой.',
 'Шорты карго из плотного хлопка',2890,NULL,29,'men','ELEVATE','Вьетнам','100% хлопок','Хаки',
 true,false,false,false,true,false,ARRAY['лето'],ARRAY['https://picsum.photos/seed/elevate-m-113/800/1000','https://picsum.photos/seed/elevate-m-113b/800/1000'],
 NOW() - INTERVAL '47 days', NOW()),
('elevate-m-114','Куртка «Harrington»','jacket-harrington','ELV-M-114',
 'Лёгкая куртка-харрингтон с воротником-стойкой и клетчатой подкладкой. Классика на прохладный день.',
 'Куртка-харрингтон',6490,NULL,20,'men','ELEVATE','Китай','60% хлопок, 40% полиэстер','Бежевый',
 true,false,false,false,true,false,ARRAY['демисезон'],ARRAY['https://picsum.photos/seed/elevate-m-114/800/1000','https://picsum.photos/seed/elevate-m-114b/800/1000'],
 NOW() - INTERVAL '40 days', NOW()),
('elevate-m-115','Лонгслив «Waffle Henley»','longsleeve-waffle-henley','ELV-M-115',
 'Лонгслив-хенли из вафельного трикотажа с планкой на пуговицах. Фактурное полотно, плотно сидит.',
 'Лонгслив-хенли вафельный',2690,NULL,32,'men','ELEVATE','Узбекистан','95% хлопок, 5% эластан','Тёмно-зелёный',
 true,false,false,false,true,false,ARRAY['демисезон','базовое'],ARRAY['https://picsum.photos/seed/elevate-m-115/800/1000','https://picsum.photos/seed/elevate-m-115b/800/1000'],
 NOW() - INTERVAL '26 days', NOW()),
('elevate-m-116','Джинсы «Selvedge Straight»','jeans-selvedge-straight','ELV-M-116',
 'Прямые джинсы из сэлвидж-денима с фирменной кромкой. Плотная ткань 13.5 oz, классическая посадка.',
 'Прямые джинсы из сэлвидж-денима',6290,NULL,25,'men','ELEVATE','Китай','100% хлопок','Индиго',
 true,false,false,false,true,false,ARRAY['деним'],ARRAY['https://picsum.photos/seed/elevate-m-116/800/1000','https://picsum.photos/seed/elevate-m-116b/800/1000'],
 NOW() - INTERVAL '45 days', NOW()),
('elevate-m-117','Жилет «Quilted Gilet»','gilet-quilted','ELV-M-117',
 'Стёганый жилет с лёгким утеплителем и стойкой. Удобен поверх свитера в межсезонье.',
 'Стёганый утеплённый жилет',5290,NULL,22,'men','ELEVATE','Китай','100% полиэстер; наполнитель 100% полиэстер','Тёмно-синий',
 true,false,false,false,true,false,ARRAY['демисезон'],ARRAY['https://picsum.photos/seed/elevate-m-117/800/1000','https://picsum.photos/seed/elevate-m-117b/800/1000'],
 NOW() - INTERVAL '30 days', NOW()),
('elevate-m-118','Ветровка «Packable Shell»','jacket-packable-shell','ELV-M-118',
 'Складная ветровка из лёгкой мембраны с водоотталкивающей пропиткой. Упаковывается в собственный карман.',
 'Складная ветровка с мембраной',4990,NULL,27,'men','ELEVATE','Вьетнам','100% полиамид','Чёрный',
 true,false,false,true,true,false,ARRAY['спорт','новинка'],ARRAY['https://picsum.photos/seed/elevate-m-118/800/1000','https://picsum.photos/seed/elevate-m-118b/800/1000'],
 NOW() - INTERVAL '13 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. ФОТО ТОВАРОВ (product_images): главное фото + второй кадр у каждого.
--    Для w-101 / w-105 / w-107 / w-121 / m-103 / m-104 — варианты по цвету
--    (демонстрация выбора цвета на странице товара).
-- ============================================================================
INSERT INTO product_images (id, product_id, url, alt_text, sort_order, is_primary, media_type, color) VALUES
  -- основные кадры (по 2 на товар)
  ('pi-w-101-1','elevate-w-101','https://picsum.photos/seed/elevate-w-101/800/1000','Платье Aurora Satin',0,true,'image','Изумрудный'),
  ('pi-w-101-2','elevate-w-101','https://picsum.photos/seed/elevate-w-101b/800/1000','Платье Aurora Satin вид сзади',1,false,'image','Изумрудный'),
  ('pi-w-101-3','elevate-w-101','https://picsum.photos/seed/elevate-w-101c/800/1000','Платье Aurora Satin чёрное',2,false,'image','Чёрный'),
  ('pi-w-102-1','elevate-w-102','https://picsum.photos/seed/elevate-w-102/800/1000','Платье Riviera',0,true,'image',NULL),
  ('pi-w-102-2','elevate-w-102','https://picsum.photos/seed/elevate-w-102b/800/1000','Платье Riviera деталь',1,false,'image',NULL),
  ('pi-w-103-1','elevate-w-103','https://picsum.photos/seed/elevate-w-103/800/1000','Блузка Silk Whisper',0,true,'image',NULL),
  ('pi-w-103-2','elevate-w-103','https://picsum.photos/seed/elevate-w-103b/800/1000','Блузка Silk Whisper деталь',1,false,'image',NULL),
  ('pi-w-104-1','elevate-w-104','https://picsum.photos/seed/elevate-w-104/800/1000','Юбка-плиссе Metallic',0,true,'image',NULL),
  ('pi-w-104-2','elevate-w-104','https://picsum.photos/seed/elevate-w-104b/800/1000','Юбка-плиссе Metallic складки',1,false,'image',NULL),
  ('pi-w-105-1','elevate-w-105','https://picsum.photos/seed/elevate-w-105/800/1000','Джинсы Vintage Blue',0,true,'image','Синий'),
  ('pi-w-105-2','elevate-w-105','https://picsum.photos/seed/elevate-w-105b/800/1000','Джинсы Vintage Blue деталь',1,false,'image','Синий'),
  ('pi-w-105-3','elevate-w-105','https://picsum.photos/seed/elevate-w-105c/800/1000','Джинсы чёрные',2,false,'image','Чёрный'),
  ('pi-w-106-1','elevate-w-106','https://picsum.photos/seed/elevate-w-106/800/1000','Тренч Classic Beige',0,true,'image',NULL),
  ('pi-w-106-2','elevate-w-106','https://picsum.photos/seed/elevate-w-106b/800/1000','Тренч пояс',1,false,'image',NULL),
  ('pi-w-107-1','elevate-w-107','https://picsum.photos/seed/elevate-w-107/800/1000','Пальто Camel Wool',0,true,'image','Кэмел'),
  ('pi-w-107-2','elevate-w-107','https://picsum.photos/seed/elevate-w-107b/800/1000','Пальто Camel Wool деталь',1,false,'image','Кэмел'),
  ('pi-w-107-3','elevate-w-107','https://picsum.photos/seed/elevate-w-107c/800/1000','Пальто серое',2,false,'image','Серый'),
  ('pi-w-108-1','elevate-w-108','https://picsum.photos/seed/elevate-w-108/800/1000','Свитер Cloud Knit',0,true,'image',NULL),
  ('pi-w-108-2','elevate-w-108','https://picsum.photos/seed/elevate-w-108b/800/1000','Свитер Cloud Knit фактура',1,false,'image',NULL),
  ('pi-w-109-1','elevate-w-109','https://picsum.photos/seed/elevate-w-109/800/1000','Костюм Power Suit',0,true,'image',NULL),
  ('pi-w-109-2','elevate-w-109','https://picsum.photos/seed/elevate-w-109b/800/1000','Костюм Power Suit брюки',1,false,'image',NULL),
  ('pi-w-110-1','elevate-w-110','https://picsum.photos/seed/elevate-w-110/800/1000','Платье Slip Noir',0,true,'image',NULL),
  ('pi-w-110-2','elevate-w-110','https://picsum.photos/seed/elevate-w-110b/800/1000','Платье Slip Noir деталь',1,false,'image',NULL),
  ('pi-w-111-1','elevate-w-111','https://picsum.photos/seed/elevate-w-111/800/1000','Кардиган Cozy Mohair',0,true,'image',NULL),
  ('pi-w-111-2','elevate-w-111','https://picsum.photos/seed/elevate-w-111b/800/1000','Кардиган Cozy Mohair фактура',1,false,'image',NULL),
  ('pi-w-112-1','elevate-w-112','https://picsum.photos/seed/elevate-w-112/800/1000','Топ Basic Rib',0,true,'image',NULL),
  ('pi-w-112-2','elevate-w-112','https://picsum.photos/seed/elevate-w-112b/800/1000','Топ Basic Rib деталь',1,false,'image',NULL),
  ('pi-w-113-1','elevate-w-113','https://picsum.photos/seed/elevate-w-113/800/1000','Жакет Tweed Line',0,true,'image',NULL),
  ('pi-w-113-2','elevate-w-113','https://picsum.photos/seed/elevate-w-113b/800/1000','Жакет Tweed Line пуговицы',1,false,'image',NULL),
  ('pi-w-114-1','elevate-w-114','https://picsum.photos/seed/elevate-w-114/800/1000','Леггинсы Active Flex',0,true,'image',NULL),
  ('pi-w-114-2','elevate-w-114','https://picsum.photos/seed/elevate-w-114b/800/1000','Леггинсы Active Flex деталь',1,false,'image',NULL),
  ('pi-w-115-1','elevate-w-115','https://picsum.photos/seed/elevate-w-115/800/1000','Рубашка Poplin White',0,true,'image',NULL),
  ('pi-w-115-2','elevate-w-115','https://picsum.photos/seed/elevate-w-115b/800/1000','Рубашка Poplin White воротник',1,false,'image',NULL),
  ('pi-w-116-1','elevate-w-116','https://picsum.photos/seed/elevate-w-116/800/1000','Платье Knit Midi',0,true,'image',NULL),
  ('pi-w-116-2','elevate-w-116','https://picsum.photos/seed/elevate-w-116b/800/1000','Платье Knit Midi деталь',1,false,'image',NULL),
  ('pi-w-117-1','elevate-w-117','https://picsum.photos/seed/elevate-w-117/800/1000','Шорты Linen Summer',0,true,'image',NULL),
  ('pi-w-117-2','elevate-w-117','https://picsum.photos/seed/elevate-w-117b/800/1000','Шорты Linen Summer деталь',1,false,'image',NULL),
  ('pi-w-118-1','elevate-w-118','https://picsum.photos/seed/elevate-w-118/800/1000','Куртка Denim Crop',0,true,'image',NULL),
  ('pi-w-118-2','elevate-w-118','https://picsum.photos/seed/elevate-w-118b/800/1000','Куртка Denim Crop деталь',1,false,'image',NULL),
  ('pi-w-119-1','elevate-w-119','https://picsum.photos/seed/elevate-w-119/800/1000','Юбка Office Line',0,true,'image',NULL),
  ('pi-w-119-2','elevate-w-119','https://picsum.photos/seed/elevate-w-119b/800/1000','Юбка Office Line разрез',1,false,'image',NULL),
  ('pi-w-120-1','elevate-w-120','https://picsum.photos/seed/elevate-w-120/800/1000','Боди Second Skin',0,true,'image',NULL),
  ('pi-w-120-2','elevate-w-120','https://picsum.photos/seed/elevate-w-120b/800/1000','Боди Second Skin деталь',1,false,'image',NULL),
  ('pi-w-121-1','elevate-w-121','https://picsum.photos/seed/elevate-w-121/800/1000','Пуховик Arctic Glow',0,true,'image','Чёрный'),
  ('pi-w-121-2','elevate-w-121','https://picsum.photos/seed/elevate-w-121b/800/1000','Пуховик Arctic Glow капюшон',1,false,'image','Чёрный'),
  ('pi-w-121-3','elevate-w-121','https://picsum.photos/seed/elevate-w-121c/800/1000','Пуховик бежевый',2,false,'image','Бежевый'),
  ('pi-w-122-1','elevate-w-122','https://picsum.photos/seed/elevate-w-122/800/1000','Сарафан Floral Garden',0,true,'image',NULL),
  ('pi-w-122-2','elevate-w-122','https://picsum.photos/seed/elevate-w-122b/800/1000','Сарафан Floral Garden деталь',1,false,'image',NULL),
  ('pi-m-101-1','elevate-m-101','https://picsum.photos/seed/elevate-m-101/800/1000','Футболка Pima Tee',0,true,'image',NULL),
  ('pi-m-101-2','elevate-m-101','https://picsum.photos/seed/elevate-m-101b/800/1000','Футболка Pima Tee деталь',1,false,'image',NULL),
  ('pi-m-102-1','elevate-m-102','https://picsum.photos/seed/elevate-m-102/800/1000','Рубашка Oxford',0,true,'image',NULL),
  ('pi-m-102-2','elevate-m-102','https://picsum.photos/seed/elevate-m-102b/800/1000','Рубашка Oxford воротник',1,false,'image',NULL),
  ('pi-m-103-1','elevate-m-103','https://picsum.photos/seed/elevate-m-103/800/1000','Джинсы Raw Denim',0,true,'image','Тёмно-синий'),
  ('pi-m-103-2','elevate-m-103','https://picsum.photos/seed/elevate-m-103b/800/1000','Джинсы Raw Denim деталь',1,false,'image','Тёмно-синий'),
  ('pi-m-103-3','elevate-m-103','https://picsum.photos/seed/elevate-m-103c/800/1000','Джинсы чёрные',2,false,'image','Чёрный'),
  ('pi-m-104-1','elevate-m-104','https://picsum.photos/seed/elevate-m-104/800/1000','Худи Heavyweight',0,true,'image','Графитовый'),
  ('pi-m-104-2','elevate-m-104','https://picsum.photos/seed/elevate-m-104b/800/1000','Худи Heavyweight капюшон',1,false,'image','Графитовый'),
  ('pi-m-104-3','elevate-m-104','https://picsum.photos/seed/elevate-m-104c/800/1000','Худи бежевое',2,false,'image','Бежевый'),
  ('pi-m-105-1','elevate-m-105','https://picsum.photos/seed/elevate-m-105/800/1000','Бомбер MA-1',0,true,'image',NULL),
  ('pi-m-105-2','elevate-m-105','https://picsum.photos/seed/elevate-m-105b/800/1000','Бомбер MA-1 деталь',1,false,'image',NULL),
  ('pi-m-106-1','elevate-m-106','https://picsum.photos/seed/elevate-m-106/800/1000','Пальто Crombie',0,true,'image',NULL),
  ('pi-m-106-2','elevate-m-106','https://picsum.photos/seed/elevate-m-106b/800/1000','Пальто Crombie деталь',1,false,'image',NULL),
  ('pi-m-107-1','elevate-m-107','https://picsum.photos/seed/elevate-m-107/800/1000','Свитшот Loopback',0,true,'image',NULL),
  ('pi-m-107-2','elevate-m-107','https://picsum.photos/seed/elevate-m-107b/800/1000','Свитшот Loopback фактура',1,false,'image',NULL),
  ('pi-m-108-1','elevate-m-108','https://picsum.photos/seed/elevate-m-108/800/1000','Чиносы Stretch',0,true,'image',NULL),
  ('pi-m-108-2','elevate-m-108','https://picsum.photos/seed/elevate-m-108b/800/1000','Чиносы Stretch деталь',1,false,'image',NULL),
  ('pi-m-109-1','elevate-m-109','https://picsum.photos/seed/elevate-m-109/800/1000','Пуховик Alpine Down',0,true,'image',NULL),
  ('pi-m-109-2','elevate-m-109','https://picsum.photos/seed/elevate-m-109b/800/1000','Пуховик Alpine Down капюшон',1,false,'image',NULL),
  ('pi-m-110-1','elevate-m-110','https://picsum.photos/seed/elevate-m-110/800/1000','Поло Pique',0,true,'image',NULL),
  ('pi-m-110-2','elevate-m-110','https://picsum.photos/seed/elevate-m-110b/800/1000','Поло Pique воротник',1,false,'image',NULL),
  ('pi-m-111-1','elevate-m-111','https://picsum.photos/seed/elevate-m-111/800/1000','Костюм Navy Suit',0,true,'image',NULL),
  ('pi-m-111-2','elevate-m-111','https://picsum.photos/seed/elevate-m-111b/800/1000','Костюм Navy Suit брюки',1,false,'image',NULL),
  ('pi-m-112-1','elevate-m-112','https://picsum.photos/seed/elevate-m-112/800/1000','Кардиган Shawl',0,true,'image',NULL),
  ('pi-m-112-2','elevate-m-112','https://picsum.photos/seed/elevate-m-112b/800/1000','Кардиган Shawl деталь',1,false,'image',NULL),
  ('pi-m-113-1','elevate-m-113','https://picsum.photos/seed/elevate-m-113/800/1000','Шорты Cargo',0,true,'image',NULL),
  ('pi-m-113-2','elevate-m-113','https://picsum.photos/seed/elevate-m-113b/800/1000','Шорты Cargo карманы',1,false,'image',NULL),
  ('pi-m-114-1','elevate-m-114','https://picsum.photos/seed/elevate-m-114/800/1000','Куртка Harrington',0,true,'image',NULL),
  ('pi-m-114-2','elevate-m-114','https://picsum.photos/seed/elevate-m-114b/800/1000','Куртка Harrington подкладка',1,false,'image',NULL),
  ('pi-m-115-1','elevate-m-115','https://picsum.photos/seed/elevate-m-115/800/1000','Лонгслив Henley',0,true,'image',NULL),
  ('pi-m-115-2','elevate-m-115','https://picsum.photos/seed/elevate-m-115b/800/1000','Лонгслив Henley планка',1,false,'image',NULL),
  ('pi-m-116-1','elevate-m-116','https://picsum.photos/seed/elevate-m-116/800/1000','Джинсы Selvedge',0,true,'image',NULL),
  ('pi-m-116-2','elevate-m-116','https://picsum.photos/seed/elevate-m-116b/800/1000','Джинсы Selvedge кромка',1,false,'image',NULL),
  ('pi-m-117-1','elevate-m-117','https://picsum.photos/seed/elevate-m-117/800/1000','Жилет Gilet',0,true,'image',NULL),
  ('pi-m-117-2','elevate-m-117','https://picsum.photos/seed/elevate-m-117b/800/1000','Жилет Gilet деталь',1,false,'image',NULL),
  ('pi-m-118-1','elevate-m-118','https://picsum.photos/seed/elevate-m-118/800/1000','Ветровка Shell',0,true,'image',NULL),
  ('pi-m-118-2','elevate-m-118','https://picsum.photos/seed/elevate-m-118b/800/1000','Ветровка Shell упаковка',1,false,'image',NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. СВЯЗИ ТОВАР ↔ КАТЕГОРИЯ (product_category) — для страниц витрины.
--    Основная привязка women/men + кросс-привязки к «Новинки» и «Коллекции».
-- ============================================================================
INSERT INTO product_category (id, product_id, category_id) VALUES
  -- women → women
  ('pc-w-101','elevate-w-101','women'),('pc-w-102','elevate-w-102','women'),
  ('pc-w-103','elevate-w-103','women'),('pc-w-104','elevate-w-104','women'),
  ('pc-w-105','elevate-w-105','women'),('pc-w-106','elevate-w-106','women'),
  ('pc-w-107','elevate-w-107','women'),('pc-w-108','elevate-w-108','women'),
  ('pc-w-109','elevate-w-109','women'),('pc-w-110','elevate-w-110','women'),
  ('pc-w-111','elevate-w-111','women'),('pc-w-112','elevate-w-112','women'),
  ('pc-w-113','elevate-w-113','women'),('pc-w-114','elevate-w-114','women'),
  ('pc-w-115','elevate-w-115','women'),('pc-w-116','elevate-w-116','women'),
  ('pc-w-117','elevate-w-117','women'),('pc-w-118','elevate-w-118','women'),
  ('pc-w-119','elevate-w-119','women'),('pc-w-120','elevate-w-120','women'),
  ('pc-w-121','elevate-w-121','women'),('pc-w-122','elevate-w-122','women'),
  -- men → men
  ('pc-m-101','elevate-m-101','men'),('pc-m-102','elevate-m-102','men'),
  ('pc-m-103','elevate-m-103','men'),('pc-m-104','elevate-m-104','men'),
  ('pc-m-105','elevate-m-105','men'),('pc-m-106','elevate-m-106','men'),
  ('pc-m-107','elevate-m-107','men'),('pc-m-108','elevate-m-108','men'),
  ('pc-m-109','elevate-m-109','men'),('pc-m-110','elevate-m-110','men'),
  ('pc-m-111','elevate-m-111','men'),('pc-m-112','elevate-m-112','men'),
  ('pc-m-113','elevate-m-113','men'),('pc-m-114','elevate-m-114','men'),
  ('pc-m-115','elevate-m-115','men'),('pc-m-116','elevate-m-116','men'),
  ('pc-m-117','elevate-m-117','men'),('pc-m-118','elevate-m-118','men'),
  -- → new (новинки)
  ('pc-n-w101','elevate-w-101','new'),('pc-n-w102','elevate-w-102','new'),
  ('pc-n-w107','elevate-w-107','new'),('pc-n-w116','elevate-w-116','new'),
  ('pc-n-w121','elevate-w-121','new'),('pc-n-w122','elevate-w-122','new'),
  ('pc-n-m104','elevate-m-104','new'),('pc-n-m105','elevate-m-105','new'),
  ('pc-n-m109','elevate-m-109','new'),('pc-n-m118','elevate-m-118','new'),
  -- → collections (избранные подборки)
  ('pc-c-w101','elevate-w-101','collections'),('pc-c-w107','elevate-w-107','collections'),
  ('pc-c-w113','elevate-w-113','collections'),('pc-c-w121','elevate-w-121','collections'),
  ('pc-c-m104','elevate-m-104','collections'),('pc-c-m106','elevate-m-106','collections'),
  ('pc-c-m111','elevate-m-111','collections')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. ПОЛЬЗОВАТЕЛИ (40 шт.). Пароль-хэш общий (bcrypt) — для входа не нужны.
--    Аватар карточка отзыва строит сама из имени (ui-avatars), image = NULL.
-- ============================================================================
INSERT INTO users (id, name, email, password, email_verified, role, status, is_verified, created_at, updated_at) VALUES
  ('user-001','Анна Ковалёва','anna.kovaleva@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '180 days','user','active',true, NOW() - INTERVAL '185 days', NOW()),
  ('user-002','Дмитрий Соколов','d.sokolov@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '160 days','user','active',true, NOW() - INTERVAL '165 days', NOW()),
  ('user-003','Екатерина Морозова','kate.morozova@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '150 days','user','active',false, NOW() - INTERVAL '152 days', NOW()),
  ('user-004','Иван Петров','ivan.petrov88@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '140 days','user','active',true, NOW() - INTERVAL '143 days', NOW()),
  ('user-005','Мария Новикова','maria.novikova@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '135 days','user','active',true, NOW() - INTERVAL '138 days', NOW()),
  ('user-006','Алексей Волков','a.volkov@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '130 days','user','active',false, NOW() - INTERVAL '131 days', NOW()),
  ('user-007','Ольга Лебедева','olga.lebedeva@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '128 days','user','active',true, NOW() - INTERVAL '129 days', NOW()),
  ('user-008','Сергей Кузнецов','sergey.kuznetsov@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '120 days','user','active',true, NOW() - INTERVAL '122 days', NOW()),
  ('user-009','Наталья Соловьёва','n.soloveva@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '115 days','user','active',false, NOW() - INTERVAL '116 days', NOW()),
  ('user-010','Андрей Попов','andrey.popov@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '110 days','user','active',true, NOW() - INTERVAL '112 days', NOW()),
  ('user-011','Юлия Васильева','yulia.vasileva@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '105 days','user','active',true, NOW() - INTERVAL '107 days', NOW()),
  ('user-012','Михаил Зайцев','m.zaytsev@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '100 days','user','active',false, NOW() - INTERVAL '101 days', NOW()),
  ('user-013','Татьяна Павлова','tatyana.pavlova@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '98 days','user','active',true, NOW() - INTERVAL '99 days', NOW()),
  ('user-014','Николай Семёнов','n.semenov@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '95 days','user','active',true, NOW() - INTERVAL '96 days', NOW()),
  ('user-015','Виктория Орлова','viktoria.orlova@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '90 days','user','active',false, NOW() - INTERVAL '91 days', NOW()),
  ('user-016','Павел Богданов','pavel.bogdanov@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '88 days','user','active',true, NOW() - INTERVAL '89 days', NOW()),
  ('user-017','Светлана Макарова','s.makarova@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '85 days','user','active',true, NOW() - INTERVAL '86 days', NOW()),
  ('user-018','Роман Никитин','roman.nikitin@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '80 days','user','active',false, NOW() - INTERVAL '81 days', NOW()),
  ('user-019','Ирина Фёдорова','irina.fedorova@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '78 days','user','active',true, NOW() - INTERVAL '79 days', NOW()),
  ('user-020','Артём Григорьев','artem.grigoriev@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '75 days','user','active',true, NOW() - INTERVAL '76 days', NOW()),
  ('user-021','Елена Степанова','elena.stepanova@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '72 days','user','active',false, NOW() - INTERVAL '73 days', NOW()),
  ('user-022','Денис Тихонов','denis.tikhonov@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '70 days','user','active',true, NOW() - INTERVAL '71 days', NOW()),
  ('user-023','Алёна Романова','alena.romanova@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '66 days','user','active',true, NOW() - INTERVAL '67 days', NOW()),
  ('user-024','Владимир Беляев','v.belyaev@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '63 days','user','active',false, NOW() - INTERVAL '64 days', NOW()),
  ('user-025','Полина Герасимова','polina.gerasimova@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '60 days','user','active',true, NOW() - INTERVAL '61 days', NOW()),
  ('user-026','Кирилл Максимов','kirill.maksimov@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '57 days','user','active',true, NOW() - INTERVAL '58 days', NOW()),
  ('user-027','Дарья Киселёва','darya.kiseleva@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '54 days','user','active',false, NOW() - INTERVAL '55 days', NOW()),
  ('user-028','Антон Сорокин','anton.sorokin@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '50 days','user','active',true, NOW() - INTERVAL '51 days', NOW()),
  ('user-029','Ксения Воробьёва','ksenia.vorobeva@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '47 days','user','active',true, NOW() - INTERVAL '48 days', NOW()),
  ('user-030','Максим Ильин','maksim.ilin@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '44 days','user','active',false, NOW() - INTERVAL '45 days', NOW()),
  ('user-031','Валентина Гусева','valentina.guseva@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '40 days','user','active',true, NOW() - INTERVAL '41 days', NOW()),
  ('user-032','Григорий Ефимов','g.efimov@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '37 days','user','active',true, NOW() - INTERVAL '38 days', NOW()),
  ('user-033','Алина Сафонова','alina.safonova@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '34 days','user','active',false, NOW() - INTERVAL '35 days', NOW()),
  ('user-034','Егор Жуков','egor.zhukov@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '31 days','user','active',true, NOW() - INTERVAL '32 days', NOW()),
  ('user-035','Маргарита Белова','margarita.belova@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '28 days','user','active',true, NOW() - INTERVAL '29 days', NOW()),
  ('user-036','Станислав Комаров','s.komarov@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '25 days','user','active',false, NOW() - INTERVAL '26 days', NOW()),
  ('user-037','Вероника Крылова','veronika.krylova@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '22 days','user','active',true, NOW() - INTERVAL '23 days', NOW()),
  ('user-038','Тимур Алексеев','timur.alekseev@gmail.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '18 days','user','active',true, NOW() - INTERVAL '19 days', NOW()),
  ('user-039','Людмила Виноградова','l.vinogradova@mail.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '14 days','user','active',false, NOW() - INTERVAL '15 days', NOW()),
  ('user-040','Олег Капустин','oleg.kapustin@yandex.ru','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',NOW() - INTERVAL '10 days','user','active',true, NOW() - INTERVAL '11 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ (user_profiles) — имя/фамилия/телефон/город.
-- ============================================================================
INSERT INTO user_profiles (id, user_id, first_name, last_name, phone, address) VALUES
  ('up-001','user-001','Анна','Ковалёва','+7 (912) 345-67-01','г. Москва'),
  ('up-002','user-002','Дмитрий','Соколов','+7 (913) 345-67-02','г. Санкт-Петербург'),
  ('up-003','user-003','Екатерина','Морозова','+7 (914) 345-67-03','г. Екатеринбург'),
  ('up-004','user-004','Иван','Петров','+7 (915) 345-67-04','г. Новосибирск'),
  ('up-005','user-005','Мария','Новикова','+7 (916) 345-67-05','г. Казань'),
  ('up-006','user-006','Алексей','Волков','+7 (917) 345-67-06','г. Нижний Новгород'),
  ('up-007','user-007','Ольга','Лебедева','+7 (918) 345-67-07','г. Краснодар'),
  ('up-008','user-008','Сергей','Кузнецов','+7 (919) 345-67-08','г. Самара'),
  ('up-009','user-009','Наталья','Соловьёва','+7 (920) 345-67-09','г. Ростов-на-Дону'),
  ('up-010','user-010','Андрей','Попов','+7 (921) 345-67-10','г. Уфа'),
  ('up-011','user-011','Юлия','Васильева','+7 (922) 345-67-11','г. Челябинск'),
  ('up-012','user-012','Михаил','Зайцев','+7 (923) 345-67-12','г. Пермь'),
  ('up-013','user-013','Татьяна','Павлова','+7 (924) 345-67-13','г. Воронеж'),
  ('up-014','user-014','Николай','Семёнов','+7 (925) 345-67-14','г. Волгоград'),
  ('up-015','user-015','Виктория','Орлова','+7 (926) 345-67-15','г. Москва'),
  ('up-016','user-016','Павел','Богданов','+7 (927) 345-67-16','г. Саратов'),
  ('up-017','user-017','Светлана','Макарова','+7 (928) 345-67-17','г. Тюмень'),
  ('up-018','user-018','Роман','Никитин','+7 (929) 345-67-18','г. Тольятти'),
  ('up-019','user-019','Ирина','Фёдорова','+7 (930) 345-67-19','г. Ижевск'),
  ('up-020','user-020','Артём','Григорьев','+7 (931) 345-67-20','г. Барнаул'),
  ('up-021','user-021','Елена','Степанова','+7 (932) 345-67-21','г. Иркутск'),
  ('up-022','user-022','Денис','Тихонов','+7 (933) 345-67-22','г. Хабаровск'),
  ('up-023','user-023','Алёна','Романова','+7 (934) 345-67-23','г. Ярославль'),
  ('up-024','user-024','Владимир','Беляев','+7 (935) 345-67-24','г. Владивосток'),
  ('up-025','user-025','Полина','Герасимова','+7 (936) 345-67-25','г. Махачкала'),
  ('up-026','user-026','Кирилл','Максимов','+7 (937) 345-67-26','г. Томск'),
  ('up-027','user-027','Дарья','Киселёва','+7 (938) 345-67-27','г. Оренбург'),
  ('up-028','user-028','Антон','Сорокин','+7 (939) 345-67-28','г. Кемерово'),
  ('up-029','user-029','Ксения','Воробьёва','+7 (940) 345-67-29','г. Рязань'),
  ('up-030','user-030','Максим','Ильин','+7 (941) 345-67-30','г. Тула'),
  ('up-031','user-031','Валентина','Гусева','+7 (942) 345-67-31','г. Липецк'),
  ('up-032','user-032','Григорий','Ефимов','+7 (943) 345-67-32','г. Киров'),
  ('up-033','user-033','Алина','Сафонова','+7 (944) 345-67-33','г. Чебоксары'),
  ('up-034','user-034','Егор','Жуков','+7 (945) 345-67-34','г. Калининград'),
  ('up-035','user-035','Маргарита','Белова','+7 (946) 345-67-35','г. Брянск'),
  ('up-036','user-036','Станислав','Комаров','+7 (947) 345-67-36','г. Курск'),
  ('up-037','user-037','Вероника','Крылова','+7 (948) 345-67-37','г. Сочи'),
  ('up-038','user-038','Тимур','Алексеев','+7 (949) 345-67-38','г. Москва'),
  ('up-039','user-039','Людмила','Виноградова','+7 (950) 345-67-39','г. Санкт-Петербург'),
  ('up-040','user-040','Олег','Капустин','+7 (951) 345-67-40','г. Тверь')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 7. ОТЗЫВЫ (125 шт., все уникальные). is_approved = true → видны на сайте.
--    locale='ru'. Распределение оценок реалистичное (преобладают 4-5).
--    На несколько отзывов добавлен ответ магазина (admin_response).
-- ============================================================================
INSERT INTO reviews (id, user_id, product_id, rating, title, comment, is_verified_purchase, is_approved, helpful_count, locale, admin_response, admin_responded_at, created_at, updated_at) VALUES
-- ── w-101 Платье Aurora Satin (7) ──
('rev-001','user-001','elevate-w-101',5,'Идеально для свадьбы подруги','Заказывала на торжество — платье село как влитое. Атлас плотный, не просвечивает, на фото вживую даже красивее. Изумрудный цвет шикарный.',true,true,24,'ru',NULL,NULL,NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
('rev-002','user-005','elevate-w-101',5,'Очень довольна','Ткань струится, садится по фигуре и при этом не липнет. Брала свой 44 размер, подошёл идеально. Однозначно рекомендую.',true,true,15,'ru',NULL,NULL,NOW() - INTERVAL '36 days', NOW() - INTERVAL '36 days'),
('rev-003','user-011','elevate-w-101',4,'Красивое, но мнётся','Платье очень эффектное, но атлас сильно заминается, если посидеть. Перед выходом пришлось отпаривать. В остальном — отлично.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('rev-004','user-019','elevate-w-101',5,'Комплименты весь вечер','Надевала на юбилей, столько комплиментов давно не получала. Длина миди удачная, на каблуке смотрится дорого.',true,true,12,'ru',NULL,NULL,NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('rev-005','user-023','elevate-w-101',3,'Маломерит','Платье красивое, но по груди оказалось узковато, пришлось брать на размер больше. Советую заказывать с запасом.',true,true,18,'ru','Спасибо за отзыв! Добавили уточнение по размерной сетке в карточку товара, чтобы выбор был точнее.',NOW() - INTERVAL '19 days',NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('rev-006','user-029','elevate-w-101',5,'Любимое платье','Уже второй раз выгуливаю, ткань держится отлично после химчистки. Цвет не потускнел.',false,true,4,'ru',NULL,NULL,NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('rev-007','user-037','elevate-w-101',4,'Хорошее за свои деньги','За такую цену качество приятно удивило. Сняла одну звезду только за то, что бретели пришлось чуть ушить под себя.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- ── w-102 Платье Riviera (4) ──
('rev-008','user-003','elevate-w-102',5,'Лучшее платье на лето','Невесомое, в жару спасает. Принт сочный, вискоза приятная к телу. Брала в отпуск — носила почти не снимая.',true,true,11,'ru',NULL,NULL,NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('rev-009','user-013','elevate-w-102',4,'Красивое, длинновато','Мне 165 см — длина в пол, чуть подшила. Сам материал и расцветка очень нравятся.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('rev-010','user-025','elevate-w-102',5,'Заказала сразу второе','Настолько понравилось, что взяла в другой расцветке. Сидит свободно, пояс подчёркивает талию.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
('rev-011','user-031','elevate-w-102',4,'Тонкая ткань','Платье отличное, но ткань довольно тонкая — лучше с нижним бельём в тон. На лето в самый раз.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
-- ── w-103 Блузка Silk Whisper (5) ──
('rev-012','user-007','elevate-w-103',5,'Настоящий шёлк','Качество на высоте, блуза струится и приятно холодит. Идеально под костюм на работу.',true,true,14,'ru',NULL,NULL,NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days'),
('rev-013','user-015','elevate-w-103',4,'Нежная, но требует ухода','Очень красивая блузка, но шёлк капризный — только деликатная стирка. Зато выглядит дорого.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('rev-014','user-021','elevate-w-103',5,'Универсальная вещь','Сочетаю и с джинсами, и с юбкой. Молочный цвет идёт к любому низу. Очень довольна покупкой.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '33 days', NOW() - INTERVAL '33 days'),
('rev-015','user-027','elevate-w-103',2,'Пришла с затяжкой','К сожалению, на рукаве была небольшая затяжка. Поддержка оперативно оформила возврат, но осадок остался.',true,true,10,'ru','Приносим извинения за брак! Заменили товар и провели дополнительную проверку партии. Спасибо, что сообщили.',NOW() - INTERVAL '27 days',NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('rev-016','user-035','elevate-w-103',5,'Села идеально','Свободный крой скрывает всё лишнее, при этом смотрится женственно. Рекомендую брать свой размер.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
-- ── w-104 Юбка-плиссе Metallic (3) ──
('rev-017','user-009','elevate-w-104',5,'Эффект вау','Юбка переливается на свету, складка держится отлично даже после носки целый день. Очень нарядно.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('rev-018','user-017','elevate-w-104',4,'Хорошая, но просвечивает','Под яркий свет немного просвечивает, ношу с нижней юбкой. В остальном претензий нет.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('rev-019','user-033','elevate-w-104',4,'Стильно и недорого','Купила на распродаже, очень довольна ценой. Сидит на талии хорошо, длина миди.',true,true,3,'ru',NULL,NULL,NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
-- ── w-105 Джинсы Vintage Blue (5) ──
('rev-020','user-002','elevate-w-105',5,'Идеальная посадка','Долго искала mom-джинсы с высокой талией, которые не врезаются. Эти — то что надо. Деним плотный.',true,true,16,'ru',NULL,NULL,NOW() - INTERVAL '46 days', NOW() - INTERVAL '46 days'),
('rev-021','user-011','elevate-w-105',4,'Хорошие, но жёсткие','Сначала деним показался жёстким, после пары стирок разносились. Цвет красивый, не линяют.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days'),
('rev-022','user-019','elevate-w-105',5,'Беру второй раз','Уже вторая пара, первая прослужила больше года. Качество стабильное, садятся отлично.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('rev-023','user-025','elevate-w-105',3,'Длинноваты','Мне пришлось подвернуть, рост 160. На высоких будут идеальны. По талии всё хорошо.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('rev-024','user-039','elevate-w-105',5,'Сидят как влитые','Подчёркивают фигуру, ткань тянется ровно настолько, чтобы было комфортно. Очень довольна.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
-- ── w-106 Тренч Classic Beige (4) ──
('rev-025','user-005','elevate-w-106',5,'Классика, которая не подведёт','Тренч мечты! Бежевый цвет универсальный, ткань плотная, не продувает. Пояс хорошо держит силуэт.',true,true,13,'ru',NULL,NULL,NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
('rev-026','user-013','elevate-w-106',4,'Отличный, но крупноват','Взяла свой размер, но по плечам великоват. Возможно стоит брать на размер меньше. Качество супер.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days'),
('rev-027','user-029','elevate-w-106',5,'Носила всю осень','Идеален для межсезонья, не промокает под мелким дождём. Карманы глубокие. Рекомендую.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('rev-028','user-037','elevate-w-106',4,'Хорошее качество','Швы ровные, фурнитура добротная. Сняла звезду за то, что складки заминаются при сидении.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
-- ── w-107 Пальто Camel Wool (6) ──
('rev-029','user-001','elevate-w-107',5,'Тёплое и стильное','Шерсти действительно много, греет в -10 без проблем. Цвет кэмел — мой фаворит, выглядит дорого.',true,true,21,'ru',NULL,NULL,NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('rev-030','user-015','elevate-w-107',5,'Шикарное пальто','Прямой крой идёт почти всем. Носила и с джинсами, и с платьем. Подкладка приятная, не электризуется.',true,true,12,'ru',NULL,NULL,NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
('rev-031','user-021','elevate-w-107',4,'Красивое, но колется','Если носить с тонкой водолазкой, шерсть немного ощущается. С шарфом проблем нет. В целом довольна.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('rev-032','user-027','elevate-w-107',5,'Стоит своих денег','Дорого, но оправдано: качество шерсти отличное, катышков нет даже после сезона. Рекомендую.',true,true,10,'ru',NULL,NULL,NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'),
('rev-033','user-033','elevate-w-107',4,'Долго ждала доставку','Само пальто отличное, но доставка заняла больше недели. За товар — пять, за ожидание — четыре.',true,true,5,'ru','Спасибо за обратную связь! Сменили транспортную компанию в вашем регионе, сроки уже сократились.',NOW() - INTERVAL '10 days',NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('rev-034','user-009','elevate-w-107',5,'Мечта сбылась','Давно присматривалась, дождалась скидки и не пожалела. Сидит идеально, тепло и элегантно.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
-- ── w-108 Свитер Cloud Knit (4) ──
('rev-035','user-003','elevate-w-108',5,'Тёплый и уютный','Как в облако завернулась. Не колется, объёмный, но не превращает в шар. Беру ещё в другом цвете.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
('rev-036','user-017','elevate-w-108',4,'Тепло, но катышки','После третьей носки появились небольшие катышки на рукавах. Сам свитер очень приятный и тёплый.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('rev-037','user-023','elevate-w-108',5,'Любимый на зиму','Ношу под пальто и отдельно дома. Мягкий, не тянется и не теряет форму. Рекомендую.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('rev-038','user-031','elevate-w-108',4,'Хороший объём','Оверсайз действительно объёмный, мне нравится. Бежевый чуть маркий, но это мелочи.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- ── w-109 Костюм Power Suit (3) ──
('rev-039','user-007','elevate-w-109',5,'Деловой и элегантный','Жакет сидит по фигуре, брюки со стрелками держат форму. На совещаниях чувствую себя уверенно.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '34 days', NOW() - INTERVAL '34 days'),
('rev-040','user-019','elevate-w-109',4,'Хороший костюм','Качество ткани приличное, но брюки оказались длинноваты — отдала в ателье. Жакет идеален.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('rev-041','user-035','elevate-w-109',5,'Универсальный комплект','Можно носить вместе и по отдельности. Графитовый цвет practичный, не маркий. Очень довольна.',true,true,3,'ru',NULL,NULL,NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
-- ── w-110 Slip Noir (3) ──
('rev-042','user-011','elevate-w-110',5,'База на все случаи','Ношу и на работу с водолазкой, и вечером отдельно. Вискоза приятная, не просвечивает. Топ.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
('rev-043','user-025','elevate-w-110',4,'Хорошее, но электризуется','Платье отличное за свою цену, но без антистатика не обойтись. Длина и посадка удачные.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
('rev-044','user-037','elevate-w-110',5,'Минимализм во всей красе','Простое и элегантное, идёт под любые аксессуары. Чёрный цвет насыщенный, не серый.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
-- ── w-111 Cozy Mohair (3) ──
('rev-045','user-005','elevate-w-111',5,'Невероятно мягкий','Мохер нежный, совсем не колется. Пудровый цвет очень приятный. Греет и выглядит дорого.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'),
('rev-046','user-021','elevate-w-111',3,'Лезет пушок','Кардиган красивый и мягкий, но мохер сильно лезет — вся тёмная одежда в пушке. Имейте в виду.',true,true,11,'ru',NULL,NULL,NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('rev-047','user-029','elevate-w-111',5,'Уютный и лёгкий','Тёплый, но при этом совсем невесомый. Накидываю поверх платья — смотрится женственно.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
-- ── w-112 Basic Rib (2) ──
('rev-048','user-013','elevate-w-112',5,'Отличная база за копейки','Плотный рубчик, хорошо тянется и держит форму. Беру сразу в нескольких цветах. Маст-хэв.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('rev-049','user-033','elevate-w-112',4,'Хороший, но короткий','Топ качественный, но мне немного коротковат — заправляю в юбку. По цене претензий нет.',true,true,2,'ru',NULL,NULL,NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- ── w-113 Tweed Line (3) ──
('rev-050','user-001','elevate-w-113',5,'Чувствую себя на миллион','Жакет в стиле Шанель, пуговицы аккуратные. Села идеально по фигуре. Ношу на работу и в ресторан.',true,true,10,'ru',NULL,NULL,NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days'),
('rev-051','user-015','elevate-w-113',4,'Красивый твид','Качество твида хорошее, подкладка приятная. Сняла звезду — рукава чуть длинноваты на мой рост.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('rev-052','user-027','elevate-w-113',5,'Элегантно и дорого','Выглядит гораздо дороже своей цены. Окантовка добавляет шика. Очень довольна покупкой.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
-- ── w-114 Active Flex (3) ──
('rev-053','user-009','elevate-w-114',5,'Не просвечивают на наклоне','Главная проблема леггинсов решена — на приседах ткань не прозрачная. Хорошо тянутся, не сползают.',true,true,12,'ru',NULL,NULL,NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('rev-054','user-017','elevate-w-114',4,'Удобные для зала','Сидят плотно, высокая посадка держит живот. Единственное — карманов нет, телефон некуда деть.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('rev-055','user-039','elevate-w-114',5,'Беру на йогу','Не сковывают движения, компрессия приятная. После стирки не растянулись. Рекомендую.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
-- ── w-115 Poplin White (2) ──
('rev-056','user-007','elevate-w-115',5,'Идеальная белая рубашка','Поплин плотный, не просвечивает, воротник держит форму. После стирки достаточно слегка отгладить.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('rev-057','user-023','elevate-w-115',4,'Хорошая, но мнётся','Качество отличное, но без утюга никак — хлопок мнётся. Зато сидит строго и аккуратно.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
-- ── w-116 Knit Midi (3) ──
('rev-058','user-003','elevate-w-116',5,'Тепло и женственно','Трикотаж мягкий, по фигуре, но не вульгарно. Гольф спасает в мороз. Серый меланж практичный.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('rev-059','user-031','elevate-w-116',4,'Красивое, но облегает','Платье хорошее, но облегает плотно — нужна гладкая фигура или утягивающее бельё. Тёплое.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('rev-060','user-035','elevate-w-116',5,'Новинка зашла','Взяла из новинок и не прогадала. Длина миди, не сковывает шаг. Ношу с сапогами.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
-- ── w-117 Linen Summer (2) ──
('rev-061','user-013','elevate-w-117',5,'Спасение в жару','Лён дышит, в +30 комфортно. Высокая талия удобная, резинка сзади не давит. Рекомендую на лето.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
('rev-062','user-025','elevate-w-117',3,'Сильно мнётся','Шорты удобные, но лён мнётся моментально — к обеду выглядят помято. Это особенность материала.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
-- ── w-118 Denim Crop (2) ──
('rev-063','user-011','elevate-w-118',5,'Любимая джинсовка','Укороченная длина отлично сочетается с платьями. Деним плотный, не растягивается. Очень довольна.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('rev-064','user-029','elevate-w-118',4,'Хорошая, но узкая в плечах','Куртка стильная, но в плечах немного узковата для меня. Если фигура хрупкая — будет идеально.',true,true,3,'ru',NULL,NULL,NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
-- ── w-119 Office Line (2) ──
('rev-065','user-021','elevate-w-119',5,'Строго и женственно','Юбка-карандаш сидит идеально, разрез сзади позволяет нормально ходить. Ткань плотная, не мнётся.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('rev-066','user-037','elevate-w-119',4,'Хорошая для офиса','Качество достойное, но цвет чуть темнее, чем на фото. В остальном претензий нет.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
-- ── w-120 Second Skin (1) ──
('rev-067','user-005','elevate-w-120',5,'Не задирается!','Наконец-то боди, которое держится на месте весь день. Бесшовное, под одеждой не видно. Супер.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
-- ── w-121 Arctic Glow (5) ──
('rev-068','user-001','elevate-w-121',5,'Спасает в -25','Реально тёплый, проверила в сильный мороз. Пух не вылезает, капюшон большой. Стоит своих денег.',true,true,19,'ru',NULL,NULL,NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('rev-069','user-015','elevate-w-121',5,'Лёгкий и тёплый','Удивил вес — пуховик почти невесомый, но греет отлично. Длина закрывает бёдра. Рекомендую.',true,true,11,'ru',NULL,NULL,NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('rev-070','user-027','elevate-w-121',4,'Тёплый, но маркий','Греет прекрасно, но чёрный цвет собирает пыль и ворс. В остальном отличная зимняя вещь.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('rev-071','user-033','elevate-w-121',5,'Лучшая покупка зимы','Долго выбирала пуховик и остановилась на этом. Не пожалела ни разу. Карманы тёплые, манжеты плотные.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('rev-072','user-039','elevate-w-121',4,'Большемерит','Взяла свой размер — оказался великоват, но для пуховика это даже плюс, поддеваю свитер. Тёплый.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- ── w-122 Floral Garden (3) ──
('rev-073','user-003','elevate-w-122',5,'Лето в одном платье','Принт очень нежный, открытые плечи смотрятся романтично. Юбка красиво расклешается. Влюбилась.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('rev-074','user-023','elevate-w-122',4,'Красивое, тонкое','Сарафан лёгкий и нарядный, но ткань тонкая — нужна комбинация. Принт как на фото.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('rev-075','user-031','elevate-w-122',5,'Ношу всё лето','Удобный, дышащий, на пуговицах — легко надевать. Получила много комплиментов на отдыхе.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
-- ── m-101 Pima Tee (4) ──
('rev-076','user-004','elevate-m-101',5,'Лучшая базовая футболка','Хлопок пима реально мягкий и плотный. После десятка стирок не растянулась и не посерела. Беру ещё.',true,true,15,'ru',NULL,NULL,NOW() - INTERVAL '48 days', NOW() - INTERVAL '48 days'),
('rev-077','user-008','elevate-m-101',5,'Качество на уровне','Швы ровные, ворот не вытягивается. Сидит ровно, не мешковато. За эти деньги — отлично.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
('rev-078','user-014','elevate-m-101',4,'Хорошая, чуть просвечивает','Белая немного просвечивает на солнце, в остальном претензий нет. Материал приятный к телу.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('rev-079','user-026','elevate-m-101',5,'Беру по 3 штуки','Идеальная база под всё. Не мнётся сильно, форму держит. Заказываю регулярно.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
-- ── m-102 Oxford Classic (4) ──
('rev-080','user-002','elevate-m-102',5,'Универсальная рубашка','Ношу и на работу под пиджак, и в выходные с джинсами. Оксфорд плотный, держит форму весь день.',true,true,12,'ru',NULL,NULL,NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days'),
('rev-081','user-010','elevate-m-102',4,'Хорошая, но села после стирки','Качество отличное, но после первой стирки чуть села. Стирайте на 30 градусах. Голубой приятный.',true,true,8,'ru','Спасибо за совет другим покупателям! Рекомендации по уходу обновили на странице товара.',NOW() - INTERVAL '36 days',NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days'),
('rev-082','user-018','elevate-m-102',5,'Сидит идеально','Прямой крой, не висит мешком и не обтягивает. Воротник на пуговицах — удобно без галстука.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
('rev-083','user-032','elevate-m-102',4,'Добротная вещь','За свои деньги отличная рубашка. Манжеты плотные, пуговицы пришиты крепко. Рекомендую.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
-- ── m-103 Raw Denim (4) ──
('rev-084','user-006','elevate-m-103',5,'Настоящий сырой деним','Плотные, со временем появляются красивые заломы. Сидят по фигуре, не сковывают. Для ценителей денима.',true,true,14,'ru',NULL,NULL,NOW() - INTERVAL '42 days', NOW() - INTERVAL '42 days'),
('rev-085','user-012','elevate-m-103',4,'Жёсткие первое время','Как и положено сырому дениму — поначалу жёсткие, потом разнашиваются под себя. Качество отличное.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '33 days', NOW() - INTERVAL '33 days'),
('rev-086','user-020','elevate-m-103',5,'Сели идеально','Slim, но не в облипку. Тёмно-синий насыщенный. После носки выглядят только лучше.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('rev-087','user-038','elevate-m-103',3,'Линяют поначалу','Деним красивый, но первые носки красят светлую обувь и руки. После пары стирок прошло.',false,true,9,'ru',NULL,NULL,NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
-- ── m-104 Heavyweight Hoodie (5) ──
('rev-088','user-004','elevate-m-104',5,'Плотное, как и обещали','400 г/м² чувствуются — худи тяжёлое и тёплое. Начёс мягкий, капюшон двойной. Лучшее за эти деньги.',true,true,18,'ru',NULL,NULL,NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
('rev-089','user-008','elevate-m-104',5,'Качество огонь','Толстый материал, не просвечивает, швы усиленные. Не растянулось после стирок. Рекомендую всем.',true,true,11,'ru',NULL,NULL,NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('rev-090','user-016','elevate-m-104',4,'Тёплое, но большемерит','Отличное худи, но размер взял свой — оказалось великовато. Берите на размер меньше для четкой посадки.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
('rev-091','user-030','elevate-m-104',5,'Ношу не снимая','Самое уютное худи в гардеробе. Графитовый цвет практичный. Капюшон держит форму. Беру второе.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('rev-092','user-040','elevate-m-104',5,'Стоит каждого рубля','Сравнивал с дорогими брендами — это не хуже. Плотное, тёплое, отлично сшито.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
-- ── m-105 Bomber MA-1 (3) ──
('rev-093','user-010','elevate-m-105',5,'Классический бомбер','Силуэт точь-в-точь как у оригинальных MA-1. Резинки плотные, молния качественная. Хаки универсальный.',true,true,10,'ru',NULL,NULL,NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
('rev-094','user-022','elevate-m-105',4,'Хорош для демисезона','В +10 комфортно, в холоднее уже прохладно. Утеплитель лёгкий. Для весны-осени самое то.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('rev-095','user-034','elevate-m-105',5,'Сел отлично','Не люблю объёмные куртки, этот сидит по фигуре. Карман на рукаве — приятная деталь.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
-- ── m-106 Wool Crombie (3) ──
('rev-096','user-006','elevate-m-106',5,'Солидное пальто','Шерсти много, держит тепло и форму. Тёмно-синий смотрится строго и дорого. Под костюм идеально.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '36 days', NOW() - INTERVAL '36 days'),
('rev-097','user-018','elevate-m-106',4,'Качество хорошее','Пальто добротное, но рукава чуть длинноваты. Подшил у портного — теперь идеально. Тёплое.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
('rev-098','user-024','elevate-m-106',5,'Достойная классика','Носил всю зиму с шарфом, не продувает. Подкладка добротная. Однозначно рекомендую.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
-- ── m-107 Loopback (3) ──
('rev-099','user-008','elevate-m-107',5,'Удобный круглый год','Футер без начёса — не жарко весной и осенью. Прямой крой, не мешковатый. Отличная база.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('rev-100','user-020','elevate-m-107',4,'Хороший свитшот','Качество приятное, серый меланж классический. Сняла звезду — манжеты чуть свободные.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('rev-101','user-032','elevate-m-107',5,'Беру на каждый день','Простой, удобный, хорошо сочетается с чем угодно. После стирок как новый.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
-- ── m-108 Stretch Chinos (3) ──
('rev-102','user-012','elevate-m-108',5,'Удобные и аккуратные','Стрейч делает их очень комфортными, при этом выглядят строго. Ношу и в офис, и на встречи.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '32 days', NOW() - INTERVAL '32 days'),
('rev-103','user-026','elevate-m-108',4,'Хорошие чиносы','Сидят отлично, но бежевый цвет немного маркий. В тёмных вариантах было бы практичнее.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('rev-104','user-036','elevate-m-108',5,'Замена джинсам','Когда джинсы надоели — эти чиносы спасают. Не стесняют движений, хорошо держат стрелку.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
-- ── m-109 Alpine Down (4) ──
('rev-105','user-004','elevate-m-109',5,'Тёплый и лёгкий','Натуральный пух греет отлично, при этом куртка лёгкая. Мембрана не продувается. Доволен на 100%.',true,true,13,'ru',NULL,NULL,NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
('rev-106','user-014','elevate-m-109',5,'Пережил сибирскую зиму','В -30 не замёрз. Капюшон регулируется, манжеты плотные. Лучшая зимняя покупка.',true,true,9,'ru',NULL,NULL,NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('rev-107','user-022','elevate-m-109',4,'Тёплый, но шуршит','Греет прекрасно, но верхняя ткань немного шуршит при движении. Мелочь, но отмечу.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
('rev-108','user-038','elevate-m-109',5,'Стоит своих денег','Брал на распродаже, очень доволен ценой. Качество пошива и наполнителя на высоте.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
-- ── m-110 Pique Polo (2) ──
('rev-109','user-008','elevate-m-110',5,'Классическое поло','Пике плотное, воротник не заворачивается. Тёмно-синий идёт ко всему. Ношу всё лето.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '46 days', NOW() - INTERVAL '46 days'),
('rev-110','user-030','elevate-m-110',4,'Хорошее, но коротковато','Поло качественное, но в длину чуть короче, чем привык. Заправляю — проблема решена.',true,true,3,'ru',NULL,NULL,NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
-- ── m-111 Navy Suit (2) ──
('rev-111','user-002','elevate-m-111',5,'Костюм на собеседование','Купил перед важной встречей — выглядел безупречно. Приталенный крой, ткань с лёгким стрейчем, удобно.',true,true,11,'ru',NULL,NULL,NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
('rev-112','user-024','elevate-m-111',4,'Хороший костюм','За свои деньги отлично. Пиджак сидит хорошо, брюки пришлось чуть подшить. Тёмно-синий универсальный.',false,true,4,'ru',NULL,NULL,NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
-- ── m-112 Shawl Cardigan (2) ──
('rev-113','user-012','elevate-m-112',5,'Тёплый и стильный','Воротник-шалька выглядит солидно, вязка плотная. Накидываю поверх рубашки — смотрится дорого.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
('rev-114','user-036','elevate-m-112',4,'Хороший кардиган','Греет, не колется. Пуговицы крупные, удобные. Тёмно-серый практичный. Доволен покупкой.',true,true,3,'ru',NULL,NULL,NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
-- ── m-113 Cargo Shorts (2) ──
('rev-115','user-020','elevate-m-113',5,'Удобные и практичные','Карманов много, всё помещается. Хлопок плотный, не просвечивает. На лето и дачу идеальны.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '43 days', NOW() - INTERVAL '43 days'),
('rev-116','user-034','elevate-m-113',4,'Хорошие шорты','Качество достойное, но карго-карманы немного оттопыриваются, если набить. В целом доволен.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
-- ── m-114 Harrington (2) ──
('rev-117','user-006','elevate-m-114',5,'Идеальная куртка на весну','Лёгкая, клетчатая подкладка приятная, воротник-стойка защищает от ветра. Бежевый универсальный.',true,true,6,'ru',NULL,NULL,NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('rev-118','user-026','elevate-m-114',4,'Стильная, но тонкая','Куртка красивая и хорошо сшита, но для прохладной погоды тонковата. Для тёплой весны — отлично.',true,true,3,'ru',NULL,NULL,NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
-- ── m-115 Waffle Henley (2) ──
('rev-119','user-014','elevate-m-115',5,'Приятная фактура','Вафельный трикотаж смотрится интересно, не как обычный лонгслив. Плотно сидит, тёмно-зелёный сочный.',true,true,5,'ru',NULL,NULL,NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('rev-120','user-038','elevate-m-115',4,'Хороший лонгслив','Качество приятное, планка на пуговицах удобная. Сняла звезду — после стирки чуть села.',false,true,2,'ru',NULL,NULL,NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
-- ── m-116 Selvedge Straight (2) ──
('rev-121','user-012','elevate-m-116',5,'Деним высшего класса','Сэлвидж-кромка, плотная ткань 13.5 oz — чувствуется качество. Прямой крой классический. Рекомендую ценителям.',true,true,8,'ru',NULL,NULL,NOW() - INTERVAL '38 days', NOW() - INTERVAL '38 days'),
('rev-122','user-040','elevate-m-116',4,'Жёсткие, но качественные','Деним очень плотный, разнашиваются не сразу. Зато прослужат годы. Посадка прямая, как заявлено.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
-- ── m-117 Quilted Gilet (1) ──
('rev-123','user-016','elevate-m-117',5,'Незаменим в межсезонье','Накидываю поверх свитера — тепло и не сковывает руки. Стёжка аккуратная, стойка защищает шею.',true,true,4,'ru',NULL,NULL,NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
-- ── m-118 Packable Shell (2) ──
('rev-124','user-022','elevate-m-118',5,'Складывается в карман','Беру в поездки — занимает минимум места, защищает от дождя и ветра. Лёгкая, дышит. Очень удобно.',true,true,7,'ru',NULL,NULL,NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
('rev-125','user-034','elevate-m-118',4,'Хорошая ветровка','От мелкого дождя защищает, от ливня — нет, но это и не заявлено. Для города и пробежек отлично.',false,true,3,'ru',NULL,NULL,NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- ============================================================================
-- 8. ПЕРЕСЧЁТ АГРЕГАТОВ РЕЙТИНГА (на случай, если триггеры отключены).
--    Заполняем ОБЕ пары колонок: average_rating/review_count и rating_avg/rating_count.
-- ============================================================================
UPDATE products p SET
  average_rating = sub.avg_rating,
  review_count   = sub.cnt,
  rating_avg     = sub.avg_rating,
  rating_count   = sub.cnt,
  updated_at     = NOW()
FROM (
  SELECT product_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS cnt
  FROM reviews
  WHERE is_approved = TRUE
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

COMMIT;

-- ============================================================================
-- ПРОВЕРКА (выполняется после COMMIT, можно запустить отдельно)
-- ============================================================================
SELECT COUNT(*) AS new_products FROM products WHERE id LIKE 'elevate-w-1%' OR id LIKE 'elevate-m-1%';
SELECT COUNT(*) AS new_users     FROM users    WHERE id LIKE 'user-0%';
SELECT COUNT(*) AS new_reviews   FROM reviews  WHERE id LIKE 'rev-%';
SELECT p.name, p.average_rating, p.review_count
FROM products p
WHERE (p.id LIKE 'elevate-w-1%' OR p.id LIKE 'elevate-m-1%') AND p.review_count > 0
ORDER BY p.review_count DESC, p.average_rating DESC
LIMIT 15;
