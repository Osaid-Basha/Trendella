import type { NormalizedProduct } from "../../schemas/product";

export type CatalogProduct = Omit<NormalizedProduct, "affiliate_url"> & {
  affiliate_base: string;
  interests: string[];
  categories: string[];
  colors?: string[];
  brands?: string[];
};

export const amazonCatalog: CatalogProduct[] = [
  {
    id: "amazon_B0D1XD1ZV3",
    store: "amazon",
    title: "Echo Dot (5th Gen) Smart Speaker with Alexa",
    description_short:
      "Compact smart speaker with improved sound, Alexa voice control, and smart home integration.",
    image: "https://m.media-amazon.com/images/I/71h6eeNMzuL._AC_SL1000_.jpg",
    price: { value: 49.99, currency: "USD" },
    rating: { value: 4.7, count: 89000 },
    badges: ["bestseller", "prime_shipping", "smart_home"],
    affiliate_base: "https://www.amazon.com/dp/B0D1XD1ZV3",
    raw: { asin: "B0D1XD1ZV3" },
    interests: ["tech", "smart home", "music", "gadgets"],
    categories: ["electronics", "tech", "audio"],
    colors: ["charcoal", "glacier white", "deep sea blue"],
    brands: ["Amazon"]
  },
  {
    id: "amazon_B0BSN5ZMBC",
    store: "amazon",
    title: "Fujifilm Instax Mini 12 Instant Camera Bundle",
    description_short:
      "Compact instant camera bundle with selfie mirror and film for on-the-go memories.",
    image: "https://m.media-amazon.com/images/I/61LMWQ9qIhL._AC_SL1500_.jpg",
    price: { value: 79.95, currency: "USD" },
    rating: { value: 4.8, count: 31000 },
    badges: ["prime_shipping", "bestseller"],
    affiliate_base: "https://www.amazon.com/dp/B0BSN5ZMBC",
    raw: { asin: "B0BSN5ZMBC" },
    interests: ["photography", "travel", "creativity"],
    categories: ["electronics", "cameras"],
    colors: ["pastel blue", "blue"],
    brands: ["Fujifilm"]
  },
  {
    id: "amazon_B0B45XQH8L",
    store: "amazon",
    title: "Therabody Theragun Mini 2.0 Handheld Massager",
    description_short:
      "Portable deep-tissue massage gun for muscle recovery with three attachments.",
    image: "https://m.media-amazon.com/images/I/51GfBxWSPAL._AC_SL1500_.jpg",
    price: { value: 199.0, currency: "USD" },
    rating: { value: 4.7, count: 6400 },
    badges: ["premium", "prime_shipping"],
    affiliate_base: "https://www.amazon.com/dp/B0B45XQH8L",
    raw: { asin: "B0B45XQH8L" },
    interests: ["fitness", "wellness", "recovery"],
    categories: ["health", "fitness"],
    colors: ["black"],
    brands: ["Theragun", "Therabody"]
  },
  {
    id: "amazon_B07Z5QF7TB",
    store: "amazon",
    title: "Ember Temperature Control Smart Mug 2",
    description_short:
      "Smart ceramic mug that maintains drink temperature via app control for 80 minutes.",
    image: "https://m.media-amazon.com/images/I/61Uv9KMT9zL._AC_SL1500_.jpg",
    price: { value: 149.95, currency: "USD" },
    rating: { value: 4.6, count: 11000 },
    badges: ["smart_home", "giftable"],
    affiliate_base: "https://www.amazon.com/dp/B07Z5QF7TB",
    raw: { asin: "B07Z5QF7TB" },
    interests: ["coffee", "tea", "gadgets", "office"],
    categories: ["kitchen", "tech"],
    colors: ["black", "white"],
    brands: ["Ember"]
  },
  {
    id: "amazon_B0752XRB5F",
    store: "amazon",
    title: "Kindle Paperwhite (8 GB) – 6.8\" Display",
    description_short:
      "Waterproof e-reader with adjustable warm light and weeks of battery life.",
    image: "https://m.media-amazon.com/images/I/61Brxj2iFtL._AC_SL1000_.jpg",
    price: { value: 149.99, currency: "USD" },
    rating: { value: 4.7, count: 95000 },
    badges: ["bestseller", "prime_shipping"],
    affiliate_base: "https://www.amazon.com/dp/B0752XRB5F",
    raw: { asin: "B0752XRB5F" },
    interests: ["reading", "books", "tech"],
    categories: ["electronics", "ebooks"],
    colors: ["black"],
    brands: ["Amazon"]
  },
  {
    id: "amazon_B0BDJ7FGDM",
    store: "amazon",
    title: "Apple AirTag",
    description_short:
      "Precision tracking device that works with Find My network to locate your belongings.",
    image: "https://m.media-amazon.com/images/I/71COpV7HpJL._AC_SL1500_.jpg",
    price: { value: 29.00, currency: "USD" },
    rating: { value: 4.7, count: 320000 },
    badges: ["bestseller", "prime_shipping"],
    affiliate_base: "https://www.amazon.com/dp/B0BDJ7FGDM",
    raw: { asin: "B0BDJ7FGDM" },
    interests: ["tech", "tracking", "organization", "gadgets"],
    categories: ["electronics", "tech", "accessories"],
    colors: ["white", "silver"],
    brands: ["Apple"]
  },
  {
    id: "amazon_B0CX59VH6C",
    store: "amazon",
    title: "Anker Portable Charger 10000mAh Power Bank",
    description_short:
      "Ultra-compact power bank with dual USB ports and fast charging for phones and tablets.",
    image: "https://m.media-amazon.com/images/I/51fWKGEt1UL._AC_SL1500_.jpg",
    price: { value: 19.99, currency: "USD" },
    rating: { value: 4.6, count: 45000 },
    badges: ["prime_shipping", "compact"],
    affiliate_base: "https://www.amazon.com/dp/B0CX59VH6C",
    raw: { asin: "B0CX59VH6C" },
    interests: ["tech", "travel", "charging", "gadgets"],
    categories: ["electronics", "tech", "accessories"],
    colors: ["black"],
    brands: ["Anker"]
  },
  {
    id: "amazon_B0B7CPSSJZ",
    store: "amazon",
    title: "JBL Clip 4 Portable Bluetooth Speaker",
    description_short:
      "Ultra-portable waterproof speaker with integrated carabiner and 10 hours of playtime.",
    image: "https://m.media-amazon.com/images/I/71Ou8CuFVlL._AC_SL1500_.jpg",
    price: { value: 49.95, currency: "USD" },
    rating: { value: 4.8, count: 28000 },
    badges: ["waterproof", "prime_shipping", "portable"],
    affiliate_base: "https://www.amazon.com/dp/B0B7CPSSJZ",
    raw: { asin: "B0B7CPSSJZ" },
    interests: ["music", "outdoor", "tech", "travel"],
    categories: ["electronics", "audio", "tech"],
    colors: ["black", "blue", "red", "pink"],
    brands: ["JBL"]
  },
  {
    id: "amazon_B09HS8DL8K",
    store: "amazon",
    title: "Kindle Paperwhite (16 GB)",
    description_short:
      "Waterproof e-reader with 6.8-inch display, adjustable warm light, and weeks of battery.",
    image: "https://m.media-amazon.com/images/I/51QCk82iGsL._AC_SL1000_.jpg",
    price: { value: 139.99, currency: "USD" },
    rating: { value: 4.6, count: 47000 },
    badges: ["bestseller", "prime_shipping", "waterproof"],
    affiliate_base: "https://www.amazon.com/dp/B09HS8DL8K",
    raw: { asin: "B09HS8DL8K" },
    interests: ["reading", "books", "tech"],
    categories: ["electronics", "ebooks", "tech"],
    colors: ["black"],
    brands: ["Amazon"]
  },
  {
    id: "amazon_B0BKTWHGQ4",
    store: "amazon",
    title: "LEGO Icons Wildflower Bouquet Building Set",
    description_short:
      "Build-your-own flower bouquet with adjustable stems and vibrant botanical details.",
    image: "https://m.media-amazon.com/images/I/81zP5JG2gzL._AC_SL1500_.jpg",
    price: { value: 47.99, currency: "USD" },
    rating: { value: 4.9, count: 18000 },
    badges: ["giftable", "bestseller", "prime_shipping"],
    affiliate_base: "https://www.amazon.com/dp/B0BKTWHGQ4",
    raw: { asin: "B0BKTWHGQ4" },
    interests: ["diy", "decor", "plants", "creativity"],
    categories: ["home", "decor", "diy"],
    colors: ["multicolor", "green", "pink", "orange"],
    brands: ["LEGO"]
  },
  {
    id: "amazon_B09B8RXYM5",
    store: "amazon",
    title: "Tile Mate (2022) Bluetooth Tracker",
    description_short:
      "Find your keys, wallet, or bag with this water-resistant Bluetooth tracker with 250 ft range.",
    image: "https://m.media-amazon.com/images/I/61AQ5slhmxL._AC_SL1500_.jpg",
    price: { value: 24.99, currency: "USD" },
    rating: { value: 4.5, count: 71000 },
    badges: ["prime_shipping", "bestseller"],
    affiliate_base: "https://www.amazon.com/dp/B09B8RXYM5",
    raw: { asin: "B09B8RXYM5" },
    interests: ["tech", "organization", "tracking", "gadgets"],
    categories: ["electronics", "tech", "accessories"],
    colors: ["black", "white"],
    brands: ["Tile"]
  },
  {
    id: "amazon_B0CVXQJV47",
    store: "amazon",
    title: "Wireless Earbuds Bluetooth Headphones 40H Playtime",
    description_short:
      "True wireless earbuds with LED display, 40H playtime, and waterproof design.",
    image: "https://m.media-amazon.com/images/I/61SLv9wsNzL._AC_SL1500_.jpg",
    price: { value: 29.99, currency: "USD" },
    rating: { value: 4.4, count: 18000 },
    badges: ["prime_shipping", "waterproof"],
    affiliate_base: "https://www.amazon.com/dp/B0CVXQJV47",
    raw: { asin: "B0CVXQJV47" },
    interests: ["music", "tech", "fitness", "audio"],
    categories: ["electronics", "audio", "tech"],
    colors: ["black", "white"],
    brands: ["Generic"]
  },
  {
    id: "amazon_B0D83M8WS7",
    store: "amazon",
    title: "Logitech MX Master 3S Wireless Mouse",
    description_short:
      "Premium wireless mouse with ultra-quiet clicks, 8K DPI sensor, and multi-device support.",
    image: "https://m.media-amazon.com/images/I/61ni3t1ryQL._AC_SL1500_.jpg",
    price: { value: 99.99, currency: "USD" },
    rating: { value: 4.7, count: 15000 },
    badges: ["premium", "prime_shipping"],
    affiliate_base: "https://www.amazon.com/dp/B0D83M8WS7",
    raw: { asin: "B0D83M8WS7" },
    interests: ["tech", "work", "productivity", "gaming"],
    categories: ["electronics", "tech", "accessories"],
    colors: ["black", "pale grey"],
    brands: ["Logitech"]
  },
  {
    id: "amazon_B0CHX9CY7C",
    store: "amazon",
    title: "Govee RGBIC LED Strip Lights 50ft",
    description_short:
      "Smart LED lights with app control, music sync, and 16 million colors for room ambiance.",
    image: "https://m.media-amazon.com/images/I/71rRGPN9cPL._AC_SL1500_.jpg",
    price: { value: 99.99, currency: "USD" },
    rating: { value: 4.5, count: 23000 },
    badges: ["smart_home", "prime_shipping"],
    affiliate_base: "https://www.amazon.com/dp/B0CHX9CY7C",
    raw: { asin: "B0CHX9CY7C" },
    interests: ["decor", "tech", "lighting", "gaming"],
    categories: ["home", "lighting", "tech"],
    colors: ["rgb", "multicolor", "black"],
    brands: ["Govee"]
  },
  {
    id: "amazon_B0BSHF6XFB",
    store: "amazon",
    title: "Fujifilm Instax Mini 12 Instant Camera",
    description_short:
      "Easy-to-use instant camera with automatic exposure and close-up mode for fun photos.",
    image: "https://m.media-amazon.com/images/I/71gWNNLFonL._AC_SL1500_.jpg",
    price: { value: 69.95, currency: "USD" },
    rating: { value: 4.8, count: 12000 },
    badges: ["bestseller", "prime_shipping", "giftable"],
    affiliate_base: "https://www.amazon.com/dp/B0BSHF6XFB",
    raw: { asin: "B0BSHF6XFB" },
    interests: ["photography", "creativity", "travel", "memories"],
    categories: ["electronics", "cameras"],
    colors: ["mint green", "lilac purple", "sky blue", "clay white"],
    brands: ["Fujifilm"]
  }
];

export const aliexpressCatalog: CatalogProduct[] = [
  {
    id: "aliexpress_1005005906552721",
    store: "aliexpress",
    title: "Retro Mechanical Wireless Keyboard with RGB Backlight",
    description_short:
      "Typewriter-style bluetooth keyboard with swappable keycaps and ambient RGB lighting.",
    image: "https://ae01.alicdn.com/kf/S94e1f1f303234bcc833d9c8f27cd4a1cF.jpg",
    price: { value: 68.5, currency: "USD" },
    rating: { value: 4.8, count: 890 },
    badges: ["fast_shipping", "trending"],
    affiliate_base:
      "https://www.aliexpress.com/item/1005005906552721.html",
    raw: { sku: "1005005906552721" },
    interests: ["gaming", "aesthetics", "workspace"],
    categories: ["electronics", "peripherals"],
    colors: ["pink", "blue", "white"],
    brands: ["Ziyou Lang"]
  },
  {
    id: "aliexpress_1005006102345387",
    store: "aliexpress",
    title: "Smart Sunset Projection Lamp",
    description_short:
      "Rotating LED ambient lamp casting sunset gradients for cozy rooms and content creation.",
    image: "https://ae01.alicdn.com/kf/S668e2f69118742729b137bc8d1feb7979.jpg",
    price: { value: 23.99, currency: "USD" },
    rating: { value: 4.9, count: 3120 },
    badges: ["budget_friendly", "fast_shipping"],
    affiliate_base:
      "https://www.aliexpress.com/item/1005006102345387.html",
    raw: { sku: "1005006102345387" },
    interests: ["decor", "photography", "lighting"],
    categories: ["home", "lighting"],
    colors: ["orange", "gold"],
    brands: ["VOCALSKY"]
  },
  {
    id: "aliexpress_1005006048117780",
    store: "aliexpress",
    title: "Portable Matcha Tea Set with Whisk",
    description_short:
      "Travel-friendly matcha kit featuring ceramic bowl, whisk, and scoop in protective case.",
    image: "https://ae01.alicdn.com/kf/S8f0b086f66b44041a19d5ac8ec62de88A.jpg",
    price: { value: 34.5, currency: "USD" },
    rating: { value: 4.7, count: 540 },
    badges: ["artisan", "giftable"],
    affiliate_base:
      "https://www.aliexpress.com/item/1005006048117780.html",
    raw: { sku: "1005006048117780" },
    interests: ["tea", "wellness", "travel"],
    categories: ["kitchen", "lifestyle"],
    colors: ["green", "brown"],
    brands: ["Teanagoo"]
  },
  {
    id: "aliexpress_1005005970073315",
    store: "aliexpress",
    title: "DIY Terrarium Kit with LED Wooden Base",
    description_short:
      "Complete terrarium kit including glass dome, moss, and LED base for ambient glow.",
    image: "https://ae01.alicdn.com/kf/S47ed7f56948b41f9a2a06ebc06c5ba04g.jpg",
    price: { value: 42.75, currency: "USD" },
    rating: { value: 4.8, count: 210 },
    badges: ["eco_friendly", "handmade_style"],
    affiliate_base:
      "https://www.aliexpress.com/item/1005005970073315.html",
    raw: { sku: "1005005970073315" },
    interests: ["plants", "diy", "decor"],
    categories: ["home", "decor"],
    colors: ["green", "warm white"]
  },
  {
    id: "aliexpress_1005006004736656",
    store: "aliexpress",
    title: "Minimalist Magnetic Levitation Planter",
    description_short:
      "Floating planter that rotates gently, ideal for succulents and modern desks.",
    image: "https://ae01.alicdn.com/kf/S9f83b48720504d5c9b6316c69e04829cQ.jpg",
    price: { value: 98.0, currency: "USD" },
    rating: { value: 4.6, count: 430 },
    badges: ["premium", "wow_factor"],
    affiliate_base:
      "https://www.aliexpress.com/item/1005006004736656.html",
    raw: { sku: "1005006004736656" },
    interests: ["tech", "decor", "plants"],
    categories: ["home", "tech"],
    colors: ["white", "wood"]
  }
];

export const sheinCatalog: CatalogProduct[] = [
  {
    id: "shein_sw23060112328",
    store: "shein",
    title: "SHEIN EZwear Colorblock Hoodie Set",
    description_short:
      "Cozy colorblock hoodie and jogger set with relaxed fit and soft fleece interior.",
    image: "https://img.ltwebstatic.com/images3_pi/2023/07/14/1689324526c7bcb35dbe62d6f400d0dc1d3523fcbb.webp",
    price: { value: 32.0, currency: "USD" },
    rating: { value: 4.7, count: 9200 },
    badges: ["loungewear", "bestseller"],
    affiliate_base: "https://us.shein.com/SHEIN-EZwear-Colorblock-Hoodie-Set-p-25889337.html",
    raw: { sku: "sw23060112328" },
    interests: ["fashion", "comfort", "athleisure"],
    categories: ["fashion", "loungewear"],
    colors: ["pink", "beige"],
    brands: ["SHEIN"]
  },
  {
    id: "shein_sa2205272550230826",
    store: "shein",
    title: "SHEIN Home Aromatherapy Diffuser",
    description_short:
      "Minimal ceramic essential oil diffuser with auto-off safety and warm lighting.",
    image: "https://img.ltwebstatic.com/images3_pi/2022/09/20/16636603132fbe4fa6102a50637e2df8f4b2272a3e.webp",
    price: { value: 28.5, currency: "USD" },
    rating: { value: 4.8, count: 3100 },
    badges: ["home", "wellness"],
    affiliate_base: "https://us.shein.com/Aromatherapy-Diffuser-p-9416601.html",
    raw: { sku: "sa2205272550230826" },
    interests: ["wellness", "home", "aromatherapy"],
    categories: ["home", "wellness"],
    colors: ["white", "wood"],
    brands: ["SHEIN"]
  },
  {
    id: "shein_sw2108059872568526",
    store: "shein",
    title: "DAZY Rib-Knit Mock Neck Sweater",
    description_short:
      "Slim rib-knit mock neck sweater ideal for layering and capsule wardrobes.",
    image: "https://img.ltwebstatic.com/images3_pi/2021/09/02/16305367499f639a6a2c94fe860b13ffa6045aac89.webp",
    price: { value: 21.99, currency: "USD" },
    rating: { value: 4.9, count: 12800 },
    badges: ["wardrobe_essential", "budget_friendly"],
    affiliate_base: "https://us.shein.com/DAZY-Rib-Knit-Mock-Neck-Sweater-p-20066766.html",
    raw: { sku: "sw2108059872568526" },
    interests: ["fashion", "minimalist", "office"],
    categories: ["fashion", "tops"],
    colors: ["cream", "beige"],
    brands: ["DAZY"]
  },
  {
    id: "shein_sr2303164838214621",
    store: "shein",
    title: "SHEIN LUNE Crystal Statement Earrings",
    description_short:
      "Gold-tone crystal drop earrings adding sparkle for special occasions.",
    image: "https://img.ltwebstatic.com/images3_pi/2023/04/14/1681465746c1281870e7bd85e8b4785905a9d3f31f.webp",
    price: { value: 12.5, currency: "USD" },
    rating: { value: 4.6, count: 5800 },
    badges: ["occasion", "accessories"],
    affiliate_base: "https://us.shein.com/SHEIN-LUNE-Crystal-Earrings-p-21096792.html",
    raw: { sku: "sr2303164838214621" },
    interests: ["fashion", "jewelry", "occasion"],
    categories: ["fashion", "accessories"],
    colors: ["gold"],
    brands: ["SHEIN"]
  },
  {
    id: "shein_sm2107141758280994",
    store: "shein",
    title: "SHEIN Studio Minimalist Nylon Backpack",
    description_short:
      "Water-resistant nylon backpack with laptop sleeve and multiple organizer pockets.",
    image: "https://img.ltwebstatic.com/images3_pi/2021/08/21/16295119666b74fd9f5bff031f12f9545f51a54061.webp",
    price: { value: 39.0, currency: "USD" },
    rating: { value: 4.7, count: 2200 },
    badges: ["travel", "giftable"],
    affiliate_base: "https://us.shein.com/SHEIN-Studio-Minimalist-Backpack-p-21036332.html",
    raw: { sku: "sm2107141758280994" },
    interests: ["travel", "commuting", "tech"],
    categories: ["fashion", "bags"],
    colors: ["black"],
    brands: ["SHEIN"]
  }
];
