import { pgTable, serial, text, integer, decimal, timestamp, boolean, json, varchar, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enum types for PostgreSQL
export const rolesEnum = ['admin', 'manager', 'support', 'customer'] as const;
export const orderStatusEnum = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'] as const;
export const paymentStatusEnum = ['pending', 'paid', 'failed', 'refunded'] as const;
export const couponTypeEnum = ['percentage', 'fixed', 'free_shipping'] as const;

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

// Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: text('parent_id').references(() => categories.id, { onDelete: 'set null' }),
  materializedPath: text('materialized_path'), // Path like "parent1/parent2/current"
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
  cost: decimal('cost', { precision: 10, scale: 2 }), // Cost to merchant
  stock: integer('stock').default(0).notNull(),
  weight: decimal('weight', { precision: 8, scale: 2 }), // In grams
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  inStock: boolean('in_stock').default(true),
  featured: boolean('featured').default(false),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  seoTitle: text('seo_title'),
  seoDesc: text('seo_desc'),
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

// Product Images table
export const productImages = pgTable('product_images', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isMain: boolean('is_main').default(false),
  order: integer('order').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    productOrderIdx: index('product_images_product_order_idx').on(table.productId, table.order),
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

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  status: text('status', { enum: orderStatusEnum }).default('pending').notNull(),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  deliveryPrice: decimal('delivery_price', { precision: 10, scale: 2 }).default('0'),
  deliveryMethod: text('delivery_method').default('courier'),
  paymentMethod: text('payment_method').default('card'),
  paymentStatus: text('payment_status', { enum: paymentStatusEnum }).default('pending'),
  paymentIntentId: text('payment_intent_id'), // Stripe payment intent ID
  transactionId: text('transaction_id'), // External transaction ID
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
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price at time of order
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

// Coupons table
export const coupons = pgTable('coupons', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  type: text('type', { enum: couponTypeEnum }).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(), // Discount value
  minAmount: decimal('min_amount', { precision: 10, scale: 2 }).default('0'), // Min order amount
  usageLimit: integer('usage_limit'), // Global usage limit
  perUserLimit: integer('per_user_limit'), // Per-user usage limit
  usedCount: integer('used_count').default(0),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    codeIdx: uniqueIndex('coupons_code_idx').on(table.code),
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

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const productCategoryRelations = relations(productCategory, ({ one }) => ({
  product: one(products, { fields: [productCategory.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategory.categoryId], references: [categories.id] }),
}));

// Support Chat Schema
export const chatSessions = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  telegramUserId: integer('telegram_user_id'),
  username: text('username'),
  status: varchar('status', { length: 20 }).default('ai').notNull(), // ai | waiting | human | closed
  operatorId: integer('operator_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('idx_telegram_user_id').on(t.telegramUserId),
  index('idx_status').on(t.status),
]);

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => chatSessions.id).notNull(),
  role: varchar('role', { length: 10 }).notNull(), // user | ai | operator
  content: text('content').notNull(),
  meta: json('meta'), // { confidence?: number, fallback?: boolean, messageId?: number, ragChunks?: string[] }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const operators = pgTable('operators', {
  id: serial('id').primaryKey(),
  telegramUserId: integer('telegram_user_id').unique().notNull(),
  name: text('name'),
  status: varchar('status', { length: 10 }).default('offline'), // online | busy | offline
  lastActiveAt: timestamp('last_active_at').defaultNow(),
});

export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
  messages: many(messages),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, { fields: [messages.sessionId], references: [chatSessions.id] }),
}));

// Support Chat Messages table
export const supportChatMessages = pgTable('support_chat_messages', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull(), // Unique session for each chat conversation
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Optional: if user is logged in
  userEmail: text('user_email'), // Optional: user email if provided
  userName: text('user_name'), // Optional: user name if provided
  message: text('message').notNull(),
  sender: text('sender', { enum: ['user', 'ai', 'admin'] }).notNull(),
  aiModel: text('ai_model'), // Which AI model was used (openai, groq, fallback)
  isResolved: boolean('is_resolved').default(false),
  userAgent: text('user_agent'), // Browser info
  ipAddress: text('ip_address'), // User IP
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
  aiDisabled: boolean('ai_disabled').default(false), // Whether AI is disabled for this chat
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
}));

// Contact Messages table
export const contactMessages = pgTable('contact_messages', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Reference to user if logged in
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  category: text('category', { enum: ['general', 'order', 'return', 'complaint', 'cooperation', 'other'] }).default('general'),
  status: text('status', { enum: ['new', 'in_progress', 'resolved', 'closed'] }).default('new'),
  priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] }).default('normal'),
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }), // Staff member assigned
  repliedAt: timestamp('replied_at', { mode: 'date' }),
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  resolutionNotes: text('resolution_notes'),
  userAgent: text('user_agent'), // Browser info
  ipAddress: text('ip_address'), // User IP
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('contact_messages_user_idx').on(table.userId),
    emailIdx: index('contact_messages_email_idx').on(table.email),
    statusIdx: index('contact_messages_status_idx').on(table.status),
    categoryIdx: index('contact_messages_category_idx').on(table.category),
    createdAtIdx: index('contact_messages_created_at_idx').on(table.createdAt),
  };
});

// Relations for contact messages
export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  user: one(users, { fields: [contactMessages.userId], references: [users.id] }),
  assignedStaff: one(users, { fields: [contactMessages.assignedTo], references: [users.id] }),
}));
