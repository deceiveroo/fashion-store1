import { pgTable, serial, text, integer, decimal, timestamp, boolean, json, jsonb, varchar, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enum types for PostgreSQL
export const rolesEnum = ['admin', 'manager', 'support', 'customer'] as const;
export const orderStatusEnum = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
export const paymentStatusEnum = ['pending', 'paid', 'failed', 'refunded'] as const;
export const couponTypeEnum = ['percentage', 'fixed', 'free_shipping'] as const;
export const installmentStatusEnum = ['pending', 'active', 'completed', 'cancelled', 'overdue'] as const;
export const installmentPaymentStatusEnum = ['pending', 'paid', 'overdue', 'cancelled'] as const;

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  name: text('name'),
  image: text('image'),
  role: text('role', { enum: rolesEnum }).default('customer').notNull(),
  password: text('password').notNull(),
  status: text('status').default('active').notNull(), // active, banned
  isVerified: boolean('is_verified').default(false), // Верифицирован ли пользователь
  verifiedAt: timestamp('verified_at', { mode: 'date' }), // Дата верификации
  lastSignIn: timestamp('last_sign_in', { mode: 'date' }), // Последний вход пользователя
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
  };
});

// Sessions table for NextAuth
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().notNull(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// Accounts table for NextAuth
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// Verification tokens table for NextAuth
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: uniqueIndex('verification_tokens_identifier_token_unique').on(vt.identifier, vt.token),
  })
);

// Categories table (aligned with БАЗА.txt)
export const categories = pgTable('categories', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  parentId: text('parent_id').references(() => categories.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  materializedPath: text('materialized_path'),
  position: integer('position').default(0),
  isFeatured: boolean('is_featured').default(false),
  locale: text('locale').default('ru'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
    nameIdx: index('categories_name_idx').on(table.name),
  };
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price in cents
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }), // Original price for comparison
  cost: decimal('cost_price', { precision: 10, scale: 2 }), // Cost to merchant (DB column: cost_price)
  stock: integer('stock').default(0).notNull(),
  weight: decimal('weight', { precision: 8, scale: 2 }), // In grams
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  inStock: boolean('in_stock').default(true),
  featured: boolean('featured').default(false),
  // @deprecated — historical duplicate of `featured`. Use `featured`. Kept only for legacy compatibility.
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  isNew: boolean('is_new').default(false),
  isSale: boolean('is_sale').default(false),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  seoTitle: text('seo_title'),
  seoDesc: text('seo_desc'),
  // Дополнительные поля товара
  brand: text('brand'), // Бренд (ZIMMERMANN)
  country: text('country'), // Страна производства (КИТАЙ)
  composition: text('composition'), // Основной состав (100% вискоза)
  compositionSecondary: text('composition_secondary'), // Дополнительный состав (86% полиэстер, 14% эластан)
  color: text('color'), // Цвет (Мультиколор, Цветочный принт)
  articleNumber: text('article_number'), // Артикул (0991TC261)
  productCode: text('product_code'), // Код товара (4741819)
  modelParams: text('model_params'), // Параметры модели (165/86/63/89, размер на модели – 40RU)
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
    skuIdx: uniqueIndex('products_sku_idx').on(table.sku),
    nameIdx: index('products_name_idx').on(table.name),
    priceIdx: index('products_price_idx').on(table.price),
    categoryIdx: index('products_category_idx').on(table.categoryId),
  };
});

// Product Images table (aligned with БАЗА.txt: is_primary, sort_order)
export const productImages = pgTable('product_images', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  altText: text('alt_text'),
  isMain: boolean('is_primary').default(false),
  order: integer('sort_order').default(0),
  mediaType: text('media_type').default('image').notNull(), // 'image' or 'video'
  duration: integer('duration'), // Duration in seconds for videos
  thumbnailUrl: text('thumbnail_url'), // Thumbnail for video preview
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productOrderIdx: index('product_images_product_sort_idx').on(table.productId, table.order),
    mediaTypeIdx: index('product_images_media_type_idx').on(table.mediaType),
  };
});

// Product Variants table
export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  size: text('size'), // S, M, L, etc
  color: text('color'), // Color hex or name
  sku: text('sku').notNull().unique(),
  stock: integer('stock').default(0).notNull(),
  priceAdjustment: decimal('price_adjustment', { precision: 10, scale: 2 }).default('0'), // Adjustment to base price
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    skuIdx: uniqueIndex('product_variants_sku_idx').on(table.sku),
    productIdx: index('product_variants_product_idx').on(table.productId),
  };
});

// Product Sizes table - для управления размерами и наличием
export const productSizes = pgTable('product_sizes', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  sizeName: text('size_name').notNull(), // XS, S, M, L, XL, XXL или RU 42, 44, 46, 48, 50, 52
  sizeType: text('size_type').default('international'), // international, ru, eu, us
  inStock: boolean('in_stock').default(true),
  stockCount: integer('stock_count').default(0),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productIdx: index('product_sizes_product_id_idx').on(table.productId),
    sizeNameIdx: index('product_sizes_size_name_idx').on(table.sizeName),
  };
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: text('status', { enum: orderStatusEnum }).default('pending').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(), // Subtotal before discount and delivery
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  deliveryPrice: decimal('delivery_price', { precision: 10, scale: 2 }).default('0'),
  deliveryMethod: text('delivery_method').default('courier'),
  paymentMethod: text('payment_method').default('card'),
  paymentStatus: text('payment_status', { enum: paymentStatusEnum }).default('pending'),
  paymentIntentId: text('payment_intent_id'), // Stripe payment intent ID
  transactionId: text('transaction_id'), // External transaction ID
  couponId: text('coupon_id').references(() => coupons.id, { onDelete: 'set null' }), // Applied coupon
  cryptoCurrency: text('crypto_currency'), // Cryptocurrency used for payment
  cryptoAddress: text('crypto_address'), // Address to which payment was sent
  cryptoTxId: text('crypto_tx_id'), // Transaction ID for crypto payment
  cryptoAmount: decimal('crypto_amount', { precision: 20, scale: 8 }), // Amount in cryptocurrency
  recipient: json('recipient'), // {firstName, lastName, phone, email, address}
  comment: text('comment'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
    paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  };
});

// Order Items table
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  name: text('name').notNull(), // Product name at time of order
  productName: text('product_name').notNull(), // Duplicate of name for compatibility
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price at time of order
  total: decimal('total', { precision: 12, scale: 2 }).notNull(), // Total price (price * quantity)
  quantity: integer('quantity').notNull().default(1),
  image: text('image'), // Product image at time of order
  size: text('size'), // Size from variant
  color: text('color'), // Color from variant
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    orderIdx: index('order_items_order_idx').on(table.orderId),
    productIdx: index('order_items_product_idx').on(table.productId),
  };
});

// Cart Items table
export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userProductIdx: uniqueIndex('cart_items_user_product_variant_unique').on(table.userId, table.productId, table.variantId),
    userIdx: index('cart_items_user_idx').on(table.userId),
  };
});

// Wishlist Items table (для избранного)
export const userWishlistItems = pgTable('user_wishlist_items', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userProductIdx: uniqueIndex('user_wishlist_items_user_product_unique').on(table.userId, table.productId),
    userIdx: index('user_wishlist_items_user_idx').on(table.userId),
  };
});

// Reviews table (отзывы на товары)
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }), // Для верификации покупки
  rating: integer('rating').notNull(), // 1-5 stars
  title: text('title'), // Заголовок отзыва
  comment: text('comment'), // Текст отзыва
  images: text('images').array(), // URLs фото/видео в отзыве
  isVerifiedPurchase: boolean('is_verified_purchase').default(false), // Подтвержденная покупка
  isApproved: boolean('is_approved').default(false), // Одобрено модератором
  adminResponse: text('admin_response'), // Ответ магазина
  adminRespondedAt: timestamp('admin_responded_at', { mode: 'date' }),
  helpfulCount: integer('helpful_count').default(0), // Количество "полезно"
  position: integer('position').default(0), // Для сортировки
  locale: text('locale').default('ru'), // Язык отзыва
  meta: jsonb('meta'), // Дополнительные метаданные
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productIdx: index('reviews_product_idx').on(table.productId),
    userIdx: index('reviews_user_idx').on(table.userId),
    ratingIdx: index('reviews_rating_idx').on(table.rating),
    approvedIdx: index('reviews_approved_idx').on(table.isApproved),
    verifiedIdx: index('reviews_verified_idx').on(table.isVerifiedPurchase),
    createdAtIdx: index('reviews_created_at_idx').on(table.createdAt),
    // Уникальный индекс: один отзыв на товар от одного пользователя
    userProductIdx: uniqueIndex('reviews_user_product_unique').on(table.userId, table.productId),
  };
});

// Review Helpful votes table (кто отметил отзыв полезным)
export const reviewHelpfulVotes = pgTable('review_helpful_votes', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  reviewId: text('review_id')
    .notNull()
    .references(() => reviews.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    reviewUserIdx: uniqueIndex('review_helpful_review_user_unique').on(table.reviewId, table.userId),
    reviewIdx: index('review_helpful_review_idx').on(table.reviewId),
  };
});

// Gift Cards table
export const giftCards = pgTable('gift_cards', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull(),
  purchaserEmail: text('purchaser_email').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  recipientName: text('recipient_name'),
  message: text('message'),
  status: text('status').default('pending').notNull(), // pending, sent, redeemed, expired
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  purchasedBy: text('purchased_by').references(() => users.id, { onDelete: 'set null' }),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  redeemedAt: timestamp('redeemed_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    codeIdx: index('gift_cards_code_idx').on(table.code),
    statusIdx: index('gift_cards_status_idx').on(table.status),
    purchaserIdx: index('gift_cards_purchaser_idx').on(table.purchasedBy),
  };
});

// Bundle Deals table
export const bundleDeals = pgTable('bundle_deals', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImage: text('cover_image'),
  discountPercent: integer('discount_percent').notNull().default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    slugIdx: uniqueIndex('bundle_deals_slug_idx').on(table.slug),
    activeIdx: index('bundle_deals_active_idx').on(table.isActive),
  };
});

// Bundle Items table
export const bundleItems = pgTable('bundle_items', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  bundleId: text('bundle_id')
    .notNull()
    .references(() => bundleDeals.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    bundleProductIdx: uniqueIndex('bundle_items_bundle_product_unique').on(table.bundleId, table.productId),
    bundleIdx: index('bundle_items_bundle_idx').on(table.bundleId),
  };
});

// Coupons table for marketing
export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  discount: integer('discount').notNull(), // percentage or fixed amount
  type: text('type').notNull().default('percent'), // 'percent' or 'fixed'
  minOrder: decimal('min_order', { precision: 10, scale: 2 }), // minimum order amount
  maxUses: integer('max_uses'), // maximum number of uses
  usedCount: integer('used_count').default(0),
  active: boolean('active').default(true),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    codeIdx: uniqueIndex('coupons_code_idx').on(table.code),
    activeIdx: index('coupons_active_idx').on(table.active),
    expiresIdx: index('coupons_expires_idx').on(table.expiresAt),
  };  
});

// User Coupon Usage table (история использования промокодов)
export const userCouponUsage = pgTable('user_coupon_usage', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  couponId: text('coupon_id')
    .notNull()
    .references(() => coupons.id, { onDelete: 'cascade' }),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp('used_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('user_coupon_usage_user_idx').on(table.userId),
    couponIdx: index('user_coupon_usage_coupon_idx').on(table.couponId),
    usedAtIdx: index('user_coupon_usage_used_at_idx').on(table.usedAt),
  };
});

// User Notifications table (системные уведомления от админа)
export const systemNotifications = pgTable('system_notifications', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['info', 'warning', 'success', 'error'] }).default('info'),
  targetAudience: text('target_audience', { enum: ['all', 'registered', 'admins', 'specific'] }).default('all'),
  targetUserIds: text('target_user_ids').array().$type<string[]>(), // для specific audience - явный тип string[]
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    activeIdx: index('system_notifications_active_idx').on(table.isActive),
    createdAtIdx: index('system_notifications_created_at_idx').on(table.createdAt),
  };
});

// User Notification Reads table (кто прочитал уведомление)
export const userNotificationReads = pgTable('user_notification_reads', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  notificationId: text('notification_id')
    .notNull()
    .references(() => systemNotifications.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('user_notification_reads_user_idx').on(table.userId),
    notificationIdx: index('user_notification_reads_notification_idx').on(table.notificationId),
    uniqueRead: uniqueIndex('user_notification_reads_unique').on(table.userId, table.notificationId),
  };
});

// User Notification Dismissals table (уведомления скрытые пользователем навсегда)
export const userNotificationDismissals = pgTable('user_notification_dismissals', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  notificationId: text('notification_id')
    .notNull()
    .references(() => systemNotifications.id, { onDelete: 'cascade' }),
  dismissedAt: timestamp('dismissed_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('user_notification_dismissals_user_idx').on(table.userId),
    notificationIdx: index('user_notification_dismissals_notification_idx').on(table.notificationId),
    uniqueDismissal: uniqueIndex('user_notification_dismissals_unique').on(table.userId, table.notificationId),
  };
});

// Installment Plans table (рассрочка)
export const installmentPlans = pgTable('installment_plans', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(), // Общая сумма заказа
  downPayment: decimal('down_payment', { precision: 12, scale: 2 }).default('0'), // Первоначальный взнос
  remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).notNull(), // Остаток для рассрочки
  months: integer('months').notNull(), // Срок в месяцах (3, 6, 12)
  monthlyPayment: decimal('monthly_payment', { precision: 10, scale: 2 }).notNull(), // Ежемесячный платеж
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).default('0'), // Процентная ставка (%)
  totalInterest: decimal('total_interest', { precision: 10, scale: 2 }).default('0'), // Общая переплата
  status: text('status', { enum: installmentStatusEnum }).default('pending').notNull(),
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  nextPaymentDate: timestamp('next_payment_date', { mode: 'date' }), // Дата следующего платежа
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'), // Уже выплачено
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('installment_plans_user_idx').on(table.userId),
    orderIdIdx: index('installment_plans_order_idx').on(table.orderId),
    statusIdx: index('installment_plans_status_idx').on(table.status),
  };
});

// Installment Payments table (платежи по рассрочке)
export const installmentPayments = pgTable('installment_payments', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  planId: text('plan_id')
    .notNull()
    .references(() => installmentPlans.id, { onDelete: 'cascade' }),
  paymentNumber: integer('payment_number').notNull(), // Номер платежа (1, 2, 3...)
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Сумма платежа
  dueDate: timestamp('due_date', { mode: 'date' }).notNull(), // Дата оплаты
  paidDate: timestamp('paid_date', { mode: 'date' }), // Фактическая дата оплаты
  status: text('status', { enum: installmentPaymentStatusEnum }).default('pending').notNull(),
  paymentMethod: text('payment_method'), // Способ оплаты
  transactionId: text('transaction_id'), // ID транзакции
  notes: text('notes'), // Заметки
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    planIdIdx: index('installment_payments_plan_idx').on(table.planId),
    dueDateIdx: index('installment_payments_due_date_idx').on(table.dueDate),
    statusIdx: index('installment_payments_status_idx').on(table.status),
  };
});

// Email Templates table for marketing
export const emailTemplates = pgTable('email_templates', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  category: text('category').notNull().default('marketing'), // 'marketing', 'transactional', 'notification'
  active: boolean('active').default(true),
  variables: text('variables').array(), // Array of available template variables
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    categoryIdx: index('email_templates_category_idx').on(table.category),
    activeIdx: index('email_templates_active_idx').on(table.active),
  };
});

// Site Content table for CMS
export const siteContent = pgTable('site_content', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  type: text('type').notNull(), // 'slider', 'page', 'blog'
  title: text('title').notNull(),
  slug: text('slug').unique(), // URL-friendly identifier for pages
  content: text('content'), // HTML/Markdown content
  imageUrl: text('image_url'),
  published: boolean('published').default(false),
  sortOrder: integer('sort_order').default(0), // For slider ordering
  metaDescription: text('meta_description'), // SEO
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    typeIdx: index('site_content_type_idx').on(table.type),
    publishedIdx: index('site_content_published_idx').on(table.published),
    slugIdx: index('site_content_slug_idx').on(table.slug),
  };
});

// User Profiles table (дополнительная информация о пользователе)
export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  address: text('address'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex('user_profiles_user_id_idx').on(table.userId),
  };
});

// Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey().notNull(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(), // JSON string
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    keyIdx: uniqueIndex('settings_key_idx').on(table.key),
  };
});

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // Action performed
  details: json('details'), // Additional details (old/new values)
  ip: text('ip_address'), // IP address of the user
  userAgent: text('user_agent'), // Browser/user agent
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('activity_logs_user_idx').on(table.userId),
    actionIdx: index('activity_logs_action_idx').on(table.action),
    createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
  };
});

// Product Categories relationship table
export const productCategory = pgTable('product_category', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productCategoryIdx: uniqueIndex('product_category_product_category_unique').on(table.productId, table.categoryId),
    productIdx: index('product_category_product_idx').on(table.productId),
    categoryIdx: index('product_category_category_idx').on(table.categoryId),
  };
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
  activityLogs: many(activityLogs),
}));

export const sessionsRelations = relations(users, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(users, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  orderItems: many(orderItems),
  productCategories: many(productCategory),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories, { relationName: 'parent-child' }),
  products: many(products),
  productCategories: many(productCategory),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

// Installment relations
export const installmentPlansRelations = relations(installmentPlans, ({ one, many }) => ({
  order: one(orders, { fields: [installmentPlans.orderId], references: [orders.id] }),
  user: one(users, { fields: [installmentPlans.userId], references: [users.id] }),
  payments: many(installmentPayments),
}));

export const installmentPaymentsRelations = relations(installmentPayments, ({ one }) => ({
  plan: one(installmentPlans, { fields: [installmentPayments.planId], references: [installmentPlans.id] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const productCategoryRelations = relations(productCategory, ({ one }) => ({
  product: one(products, { fields: [productCategory.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategory.categoryId], references: [categories.id] }),
}));

// Support Chat Messages table
export const supportChatMessages = pgTable('support_chat_messages', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  imageUrl: text('image_url'),
  sender: text('sender', { enum: ['user', 'ai', 'admin'] }).notNull(),
  isRead: boolean('is_read').default(false),
  readByAdmin: boolean('read_by_admin').default(false),
  readByUser: boolean('read_by_user').default(false), // Прочитано пользователем
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    sessionIdx: index('support_chat_messages_session_idx').on(table.sessionId),
    userIdx: index('support_chat_messages_user_idx').on(table.userId),
    createdAtIdx: index('support_chat_messages_created_at_idx').on(table.createdAt),
    senderIdx: index('support_chat_messages_sender_idx').on(table.sender),
  };
});

// Support Chat Sessions table (for grouping messages)
export const supportChatSessions = pgTable('support_chat_sessions', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().unique(), // Same as in messages
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: text('user_email'),
  userName: text('user_name'),
  status: text('status', { enum: ['active', 'resolved', 'archived'] }).default('active').notNull(),
  messageCount: integer('message_count').default(0),
  firstMessage: text('first_message'), // Preview of first message
  lastMessageAt: timestamp('last_message_at', { mode: 'date' }),
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }), // Admin who resolved
  notes: text('notes'), // Admin notes
  takenOverBy: text('taken_over_by').references(() => users.id, { onDelete: 'set null' }), // Admin who took over
  takenOverAt: timestamp('taken_over_at', { mode: 'date' }),
  adminName: text('admin_name'), // Name of admin responding
  adminAvatar: text('admin_avatar'), // Avatar of admin responding
  adminEmail: text('admin_email'), // Email of admin responding
  aiDisabled: boolean('ai_disabled').default(false), // Whether AI is disabled for this chat
  operatorRating: integer('operator_rating'), // Rating given to the operator (1-10)
  operatorRatedAt: timestamp('operator_rated_at', { mode: 'date' }), // When the rating was given
  operatorRatedBy: text('operator_rated_by'), // User ID who gave the rating
  firstResponseTime: integer('first_response_time'), // Time to first response in seconds
  resolutionTime: integer('resolution_time'), // Total resolution time in seconds
  customerSatisfaction: integer('customer_satisfaction'), // Customer satisfaction rating (1-5)
  tags: text('tags').array(), // Tags for categorization
  category: text('category'), // Main category of inquiry
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    sessionIdIdx: uniqueIndex('support_chat_sessions_session_id_idx').on(table.sessionId),
    userIdx: index('support_chat_sessions_user_idx').on(table.userId),
    statusIdx: index('support_chat_sessions_status_idx').on(table.status),
    createdAtIdx: index('support_chat_sessions_created_at_idx').on(table.createdAt),
  };
});

export const supportChatMessagesRelations = relations(supportChatMessages, ({ one }) => ({
  user: one(users, { fields: [supportChatMessages.userId], references: [users.id] }),
  session: one(supportChatSessions, { fields: [supportChatMessages.sessionId], references: [supportChatSessions.sessionId] }),
}));

export const supportChatSessionsRelations = relations(supportChatSessions, ({ one, many }) => ({
  user: one(users, { fields: [supportChatSessions.userId], references: [users.id] }),
  resolvedByUser: one(users, { fields: [supportChatSessions.resolvedBy], references: [users.id] }),
  messages: many(supportChatMessages),
  satisfactionRatings: many(chatSatisfactionRatings),
}));

// Chat Satisfaction Ratings table (for detailed customer feedback)
export const chatSatisfactionRatings = pgTable('chat_satisfaction_ratings', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id')
    .notNull()
    .references(() => supportChatSessions.sessionId, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  feedback: text('feedback'), // Optional text feedback
  ratedBy: text('rated_by'), // User ID or 'anonymous'
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    sessionIdIdx: index('chat_satisfaction_session_idx').on(table.sessionId),
    ratingIdx: index('chat_satisfaction_rating_idx').on(table.rating),
  };
});

// Chat Tags table (for categorizing inquiries)
export const chatTags = pgTable('chat_tags', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  color: text('color').default('#6B7280'),
  description: text('description'),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const chatSatisfactionRatingsRelations = relations(chatSatisfactionRatings, ({ one }) => ({
  session: one(supportChatSessions, { fields: [chatSatisfactionRatings.sessionId], references: [supportChatSessions.sessionId] }),
}));

// Payment Methods table
export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['card', 'wallet'] }).notNull(),
  last4: text('last4').notNull(),
  brand: text('brand').notNull(), // Visa, Mastercard, Mir, YooMoney, etc
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  holderName: text('holder_name'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('payment_methods_user_idx').on(table.userId),
  };
});

// Wishlist table (alias for userWishlistItems for easier access)
export const wishlist = userWishlistItems;

// User Sessions table (for security tracking)
export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  device: text('device'),
  location: text('location'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  lastActive: timestamp('last_active', { mode: 'date' }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('user_sessions_user_idx').on(table.userId),
    tokenIdx: uniqueIndex('user_sessions_token_idx').on(table.token),
  };
});

// Notification Settings table
export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  ordersEmail: boolean('orders_email').default(true),
  ordersPush: boolean('orders_push').default(true),
  ordersSms: boolean('orders_sms').default(false),
  promotionsEmail: boolean('promotions_email').default(true),
  promotionsPush: boolean('promotions_push').default(false),
  promotionsSms: boolean('promotions_sms').default(false),
  wishlistEmail: boolean('wishlist_email').default(true),
  wishlistPush: boolean('wishlist_push').default(true),
  wishlistSms: boolean('wishlist_sms').default(false),
  priceDropsEmail: boolean('price_drops_email').default(true),
  priceDropsPush: boolean('price_drops_push').default(true),
  priceDropsSms: boolean('price_drops_sms').default(false),
  newsletterEmail: boolean('newsletter_email').default(true),
  newsletterPush: boolean('newsletter_push').default(false),
  newsletterSms: boolean('newsletter_sms').default(false),
  securityEmail: boolean('security_email').default(true),
  securityPush: boolean('security_push').default(true),
  securitySms: boolean('security_sms').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: uniqueIndex('notification_settings_user_idx').on(table.userId),
  };
});

// User Notifications table (история уведомлений)
export const userNotifications = pgTable('user_notifications', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // Заголовок уведомления
  message: text('message').notNull(), // Текст уведомления
  type: text('type', { enum: ['order', 'promotion', 'wishlist', 'price_drop', 'security', 'system'] }).notNull(),
  category: text('category', { enum: ['orders', 'promotions', 'wishlist', 'price_drops', 'newsletter', 'security'] }).notNull(),
  channel: text('channel', { enum: ['email', 'push', 'sms', 'in_app'] }).notNull(), // Канал доставки
  read: boolean('read').default(false), // Прочитано ли
  clicked: boolean('clicked').default(false), // Кликнуто ли
  actionUrl: text('action_url'), // URL для перехода при клике
  metadata: jsonb('metadata'), // Дополнительные данные (orderId, productId и т.д.)
  sentAt: timestamp('sent_at', { mode: 'date' }).defaultNow(), // Когда отправлено
  readAt: timestamp('read_at', { mode: 'date' }), // Когда прочитано
  clickedAt: timestamp('clicked_at', { mode: 'date' }), // Когда кликнут
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('user_notifications_user_idx').on(table.userId),
    typeIdx: index('user_notifications_type_idx').on(table.type),
    readIdx: index('user_notifications_read_idx').on(table.read),
    createdAtIdx: index('user_notifications_created_at_idx').on(table.createdAt),
  };
});

// Relations for new tables
export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, { fields: [notificationSettings.userId], references: [users.id] }),
}));

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, { fields: [userNotifications.userId], references: [users.id] }),
}));

// Curated Collections table (for manual product selections by admins)
export const curatedCollections = pgTable('curated_collections', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(), // "Выбор редакции", "Летняя коллекция"
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImage: text('cover_image'), // URL изображения обложки
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0), // Для порядка отображения
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    slugIdx: uniqueIndex('curated_collections_slug_idx').on(table.slug),
  };
});

// Collection Items (products in curated collections)
export const collectionItems = pgTable('collection_items', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  collectionId: text('collection_id')
    .notNull()
    .references(() => curatedCollections.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').default(0), // Порядок товара в подборке
  addedBy: text('added_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    collectionProductIdx: uniqueIndex('collection_items_collection_product_unique').on(table.collectionId, table.productId),
    collectionIdx: index('collection_items_collection_idx').on(table.collectionId),
  };
});

// Product Views tracking (for trending recommendations)
export const productViews = pgTable('product_views', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null для гостей
  sessionId: text('session_id'), // Для отслеживания уникальных сессий
  viewedAt: timestamp('viewed_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productIdx: index('product_views_product_idx').on(table.productId),
    userIdx: index('product_views_user_idx').on(table.userId),
    viewedAtIdx: index('product_views_viewed_at_idx').on(table.viewedAt),
  };
});

// Relations for recommendation tables
export const curatedCollectionsRelations = relations(curatedCollections, ({ many, one }) => ({
  items: many(collectionItems),
  createdByUser: one(users, { fields: [curatedCollections.createdBy], references: [users.id] }),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(curatedCollections, { fields: [collectionItems.collectionId], references: [curatedCollections.id] }),
  product: one(products, { fields: [collectionItems.productId], references: [products.id] }),
  addedByUser: one(users, { fields: [collectionItems.addedBy], references: [users.id] }),
}));

export const productViewsRelations = relations(productViews, ({ one }) => ({
  product: one(products, { fields: [productViews.productId], references: [products.id] }),
  user: one(users, { fields: [productViews.userId], references: [users.id] }),
}));

// Maintenance subscriptions table
export const maintenanceSubscriptions = pgTable('maintenance_subscriptions', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  subscribedAt: timestamp('subscribed_at', { mode: 'date' }).defaultNow(),
  notified: boolean('notified').default(false),
  notifiedAt: timestamp('notified_at', { mode: 'date' }),
}, (table) => {
  return {
    emailIdx: index('idx_maintenance_subscriptions_email').on(table.email),
    notifiedIdx: index('idx_maintenance_subscriptions_notified').on(table.notified),
  };
});

export const maintenanceSubscriptionsRelations = relations(maintenanceSubscriptions, ({}) => ({}));

// Relations for product sizes
export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, { fields: [productSizes.productId], references: [products.id] }),
}));

// Relations for reviews
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  helpfulVotes: many(reviewHelpfulVotes),
}));

// Relations for review helpful votes
export const reviewHelpfulVotesRelations = relations(reviewHelpfulVotes, ({ one }) => ({
  review: one(reviews, { fields: [reviewHelpfulVotes.reviewId], references: [reviews.id] }),
  user: one(users, { fields: [reviewHelpfulVotes.userId], references: [users.id] }),
}));

// User verification requests table
export const userVerificationRequests = pgTable('user_verification_requests', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Passport data
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'), // Отчество
  
  passportSeries: text('passport_series').notNull(), // Серия паспорта
  passportNumber: text('passport_number').notNull(), // Номер паспорта
  issuedBy: text('issued_by').notNull(), // Кем выдан
  issueDate: timestamp('issue_date', { mode: 'date' }).notNull(), // Дата выдачи
  departmentCode: text('department_code'), // Код подразделения
  
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }).notNull(), // Дата рождения
  
  // Document photos (stored in Supabase Storage)
  passportPhotoFrontUrl: text('passport_photo_front_url'), // Фото разворота с фото
  passportPhotoBackUrl: text('passport_photo_back_url'), // Фото разворота с регистрацией
  selfieWithPassportUrl: text('selfie_with_passport_url'), // Селфи с паспортом
  
  // Additional info
  phoneNumber: text('phone_number').notNull(), // Контактный телефон
  additionalInfo: text('additional_info'), // Дополнительная информация
  
  // Status
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  
  // Moderation data
  reviewedBy: text('reviewed_by').references(() => users.id), // Кто рассмотрел
  reviewedAt: timestamp('reviewed_at', { mode: 'date' }), // Когда рассмотрено
  rejectionReason: text('rejection_reason'), // Причина отказа
  
  // Metadata
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('idx_verification_user_id').on(table.userId),
    statusIdx: index('idx_verification_status').on(table.status),
    createdAtIdx: index('idx_verification_created_at').on(table.createdAt),
  };
});

// Relations for verification requests
export const userVerificationRequestsRelations = relations(userVerificationRequests, ({ one }) => ({
  user: one(users, { fields: [userVerificationRequests.userId], references: [users.id] }),
  reviewer: one(users, { fields: [userVerificationRequests.reviewedBy], references: [users.id] }),
}));
