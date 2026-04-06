'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { carts, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';

// Define the cart item type
const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  attributes: z.record(z.string(), z.string()).optional(), // e.g. { size: 'M', color: 'blue' }
});

const CartSchema = z.object({
  userId: z.string().optional(), // for logged in users
  sessionId: z.string().optional(), // for guest users
  items: z.array(CartItemSchema),
  total: z.number().nonnegative(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

/**
 * Synchronizes the client-side cart with the server-side cart
 * Resolves conflicts between the two versions
 */
export async function syncCart(clientCart: Cart) {
  try {
    // Validate the input
    const validatedCart = CartSchema.parse(clientCart);
    
    // Determine which cart to use (user or session-based)
    let serverCart;
    
    if (validatedCart.userId) {
      // Find or create user cart
      serverCart = await db.query.carts.findFirst({
        where: eq(carts.userId, validatedCart.userId),
      });
      
      if (!serverCart) {
        // Create new cart for user
        const [newCart] = await db
          .insert(carts)
          .values({
            id: `cart_${nanoid()}`,
            userId: validatedCart.userId,
            meta: JSON.stringify(validatedCart.items),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        serverCart = newCart;
      } else {
        // Update existing cart
        await db
          .update(carts)
          .set({
            meta: JSON.stringify(validatedCart.items),
            updatedAt: new Date(),
          })
          .where(eq(carts.id, serverCart.id));
      }
    } else if (validatedCart.sessionId) {
      // Find or create session-based cart
      serverCart = await db.query.carts.findFirst({
        where: eq(carts.sessionId, validatedCart.sessionId),
      });
      
      if (!serverCart) {
        // Create new session cart
        const [newCart] = await db
          .insert(carts)
          .values({
            id: `cart_${nanoid()}`,
            sessionId: validatedCart.sessionId,
            meta: JSON.stringify(validatedCart.items),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        serverCart = newCart;
      } else {
        // Update existing session cart
        await db
          .update(carts)
          .set({
            meta: JSON.stringify(validatedCart.items),
            updatedAt: new Date(),
          })
          .where(eq(carts.id, serverCart.id));
      }
    } else {
      throw new Error('Either userId or sessionId must be provided to sync cart');
    }

    // Revalidate relevant paths
    if (validatedCart.userId) {
      revalidatePath(`/users/${validatedCart.userId}/cart`);
      revalidatePath('/cart');
    }

    return {
      success: true,
      serverCart,
      message: 'Cart synchronized successfully',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: `Failed to sync cart: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Merges two cart states, resolving conflicts
 * Typically used when a guest user logs in and their session cart needs to merge with their user cart
 */
export async function mergeCarts(sessionId: string, userId: string) {
  try {
    // Get session cart
    const sessionCart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    });

    // Get user cart
    const userCart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });

    // If no session cart, nothing to merge
    if (!sessionCart) {
      return {
        success: true,
        message: 'No session cart to merge',
      };
    }

    // Parse cart items from session cart
    const sessionCartItems: CartItem[] = sessionCart.meta 
      ? JSON.parse(sessionCart.meta as string) 
      : [];

    if (!sessionCartItems.length) {
      // Session cart is empty, just delete it
      await db.delete(carts).where(eq(carts.id, sessionCart.id));
      return {
        success: true,
        message: 'Session cart was empty, deleted',
      };
    }

    // If no user cart, convert session cart to user cart
    if (!userCart) {
      await db
        .update(carts)
        .set({
          userId,
          sessionId: null,
          updatedAt: new Date(),
        })
        .where(eq(carts.id, sessionCart.id));
      
      revalidatePath(`/users/${userId}/cart`);
      revalidatePath('/cart');
      
      return {
        success: true,
        message: 'Session cart converted to user cart',
      };
    }

    // Both carts exist, merge items
    const userCartItems: CartItem[] = userCart.meta 
      ? JSON.parse(userCart.meta as string) 
      : [];

    // Merge items, adding quantities for same products
    const mergedItems = [...userCartItems];
    
    for (const sessionItem of sessionCartItems) {
      const existingItemIndex = mergedItems.findIndex(
        item => item.productId === sessionItem.productId
      );
      
      if (existingItemIndex !== -1) {
        // Product already in user cart, add quantities
        mergedItems[existingItemIndex].quantity += sessionItem.quantity;
      } else {
        // New product, add to user cart
        mergedItems.push(sessionItem);
      }
    }

    // Update user cart with merged items
    await db
      .update(carts)
      .set({
        meta: JSON.stringify(mergedItems),
        updatedAt: new Date(),
      })
      .where(eq(carts.id, userCart.id));

    // Delete session cart
    await db.delete(carts).where(eq(carts.id, sessionCart.id));

    revalidatePath(`/users/${userId}/cart`);
    revalidatePath('/cart');

    return {
      success: true,
      message: 'Carts merged successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to merge carts: ` + (error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Gets the current cart for a user or session
 */
export async function getCart(userId?: string, sessionId?: string) {
  try {
    if (!userId && !sessionId) {
      return {
        success: true,
        cart: null,
        message: 'No user or session ID provided',
      };
    }

    let whereClause;
    if (userId) {
      whereClause = eq(carts.userId, userId);
    } else {
      whereClause = eq(carts.sessionId, sessionId!);
    }

    const cart = await db.query.carts.findFirst({
      where: whereClause,
    });

    return {
      success: true,
      cart: cart || null,
      message: cart ? 'Cart retrieved successfully' : 'Cart not found',
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get cart: ` + (error instanceof Error ? error.message : String(error)),
    };
  }
}