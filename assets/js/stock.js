/* Снимок склада для прототипа.
 * Источник: korrto.ru (данные, которые сайт получает из 1С:УНФ), снят 14.10.2026 14:38 МСК.
 * На боевом сайте этот файл заменит обмен с 1С (CommerceML): товары, цвета, размеры, цены, остатки.
 */
window.KORRTO_STOCK = {
  snapshot: '14.10.2026, 14:38',
  totals: { models: 266, inStock: 94, units: 12346 },

  roles: [
    { id: 'chef',    name: 'Повара и кондитеры',     all: 122, inStock: 83, img: 'assets/img/pf-studia_2.jpg', pos: '50% 18%' },
    { id: 'waiter',  name: 'Официанты и бармены',    all: 111, inStock: 23, img: 'assets/img/p-06098a-brown.jpg', pos: '50% 20%' },
    { id: 'host',    name: 'Администраторы и хостес', all: 60,  inStock: 3,  img: 'assets/img/p-02261-khaki.jpg', pos: '50% 15%' },
    { id: 'spa',     name: 'SPA и салоны красоты',    all: 7,   inStock: 4,  img: 'assets/img/p-20306-black.jpg', pos: '50% 15%' },
    { id: 'clean',   name: 'Горничные и клининг',     all: 21,  inStock: 9,  img: 'assets/img/p-20308-check.jpg', pos: '50% 15%' },
    { id: 'seller',  name: 'Продавцы',                all: 50,  inStock: 12, img: 'assets/img/p-13030-brown.jpg', pos: '50% 20%' },
    { id: 'merch',   name: 'Промо и мерч',            all: 14,  inStock: 3,  img: 'assets/img/p-11049-cap.jpg', pos: '50% 30%' },
    { id: 'textile', name: 'Текстиль для зала',       all: 6,   inStock: 0,  img: null }
  ],

  products: [
    {
      art: '04.274', name: 'Китель поварской мужской, супатная застёжка, спина-сетка',
      price: 3650,
      colors: [
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-04274-black.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { S: 80, M: 165, L: 154, XL: 167, '3XL': 86 } },
        { name: 'белый', hex: '#FFFFFF', img: 'assets/img/p-04274-white.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { S: 46, M: 83, L: 63, XL: 76, '2XL': 58, '3XL': 69 } },
        { name: 'серый', hex: '#808080', img: 'assets/img/p-04274-grey.jpg', sostav: '53% пэ, 44% хлопок, 3% эластан',
          sizes: { M: 3, XL: 1, '2XL': 1 } }
      ]
    },
    {
      art: '04.225А', name: 'Китель поварской мужской с коротким рукавом, двойная отстрочка',
      price: 3980,
      colors: [
        { name: 'белый', hex: '#FFFFFF', img: 'assets/img/p-04225a-white.jpg', sostav: '55% хлопок, 45% пэ',
          sizes: { S: 182, M: 91, L: 44, XL: 73, '2XL': 11, '3XL': 7 } },
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-04225a-black.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { S: 26, M: 20, XL: 73, '2XL': 21, '3XL': 20 } }
      ]
    },
    {
      art: '04.353', name: 'Футболка повара женская, комбинированная с трикотажем',
      price: 2990,
      colors: [
        { name: 'белый', hex: '#FFFFFF', img: 'assets/img/p-04353-white.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { XS: 19, S: 25, M: 26, L: 28, XL: 24, '2XL': 23, '3XL': 30 } },
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-04353-black.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { XS: 26, S: 58, M: 23, L: 22, XL: 13, '2XL': 13, '3XL': 6 } }
      ]
    },
    {
      art: '13.030', name: 'Поло унисекс с V-образным вырезом',
      price: 1600,
      colors: [
        { name: 'коричневый', hex: '#6A2813', img: 'assets/img/p-13030-brown.jpg', sostav: '50% хлопок, 50% пэ',
          sizes: { XS: 18, S: 20, M: 14, L: 55, XL: 61, '2XL': 79, '3XL': 36 } },
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-13030-black.jpg', sostav: '90% хлопок, 10% лайкра',
          sizes: { S: 2, L: 13, XL: 116, '2XL': 60, '3XL': 63 } },
        { name: 'белый', hex: '#FFFFFF', img: 'assets/img/p-13030-white.jpg', sostav: '92% хлопок, 8% лайкра',
          sizes: { XS: 15, S: 66, M: 32, L: 55, XL: 6, '2XL': 28, '3XL': 2 } }
      ]
    },
    {
      art: '02.261', name: 'Рубашка оверсайз с воротником-стойкой',
      price: 6500,
      colors: [
        { name: 'хаки', hex: '#958C41', img: 'assets/img/p-02261-khaki.jpg', sostav: '65% хлопок, 32% пэ, 3% спандекс',
          sizes: { S: 14, M: 21, L: 20, XL: 1 } },
        { name: 'белый', hex: '#FFFFFF', img: 'assets/img/p-02261-white.jpg', sostav: '65% хлопок, 32% пэ, 3% спандекс',
          sizes: { S: 5, M: 2, L: 8, XL: 13, '3XL': 3 } },
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-02261-black.jpg', sostav: '65% хлопок, 32% пэ, 3% спандекс',
          sizes: { S: 2, L: 5, XL: 2, '2XL': 1, '3XL': 2 } }
      ]
    },
    {
      art: '06.098А', name: 'Фартук длинный классический с карманом и отделкой',
      price: 1660,
      colors: [
        { name: 'коричневый', hex: '#6A2813', img: 'assets/img/p-06098a-brown.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { 'ONE SIZE': 231 } }
      ]
    },
    {
      art: '20.306', name: 'Комплект женский на пуговицах, рукав 3/4',
      price: 4150,
      colors: [
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-20306-black.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { XS: 19, S: 42, L: 3, XL: 20, '2XL': 9, '3XL': 4 } }
      ]
    },
    {
      art: '03.206В', name: 'Брюки профессиональные унисекс, пояс на резинке и шнурке',
      price: 2650,
      colors: [
        { name: 'чёрный', hex: '#111111', img: 'assets/img/p-03206v-black.jpg', sostav: '65% пэ, 35% хлопок',
          sizes: { XS: 70, S: 39, M: 11, L: 3, XL: 207, '2XL': 44, '3XL': 28, '4XL': 3 } }
      ]
    }
  ]
};
