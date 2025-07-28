import { useState } from "react";
import { useCart } from "react-use-cart";

import { notifyError, notifySuccess } from "@utils/toast";

const useAddToCart = () => {
  const [item, setItem] = useState(1);
  const { addItem, items, updateItemQuantity } = useCart();
  // console.log('products',products)
  // console.log("items", items);

  const handleAddItem = (product, quantityToAdd = null) => {
    const result = items.find((i) => i.id === product.id);
    const { variants, categories, description, ...updatedProduct } = product;
    
    // Dispatch cart interaction event to pause carousel autoplay
    const cartEvent = new CustomEvent('product-added-to-cart', {
      detail: { product, quantity: quantityToAdd || item }
    });
    window.dispatchEvent(cartEvent);
    
    // ----------------------------------------------
    // PROMOTION PRICING OVERRIDE
    // If the product carries a fixed-price promotion and the quantity we are
    // about to add meets (or exceeds) the minQty requirement, store the deal
    // price in `price`. Preserve the original in `basePrice` so the cart can
    // calculate blended pricing when quantity exceeds maxQty.
    // ----------------------------------------------

    if (product.promotion && product.promotion.type === 'fixed_price') {
      const promo = product.promotion;
      const effectiveQty = quantityToAdd || item;

      if (effectiveQty >= (promo.minQty || 1)) {
        // Use promotion value as price per unit
        updatedProduct.basePrice = promo.originalPrice || promo.productUnit?.price || product.price;
        updatedProduct.price = promo.offerPrice || promo.value || product.price;
        updatedProduct.minQty = promo.minQty || 1;
        updatedProduct.maxQty = promo.maxQty || null;
      }
    }
    
    // Use quantityToAdd if provided (for promotions), otherwise use item state
    const qty = quantityToAdd || item;
    
    // Handle the case for promotional items
    if (product.promotion && product.promotion.minQty > 1 && !quantityToAdd) {
      // If a promotional item with min quantity is being added without a specified quantity,
      // use the promotion's minimum quantity
      const promoQty = product.promotion.minQty;
      
      if (result !== undefined) {
        // Already in cart - check if we need to add to the existing quantity
        if (result.quantity < promoQty) {
          // Current quantity is less than min promo quantity, adjust to meet min
          updateItemQuantity(product.id, promoQty);
          notifySuccess(`${product.title} updated to ${promoQty} items in cart!`);
          return;
        }
      } else {
        // Not in cart - add with promo quantity
        if (promoQty <= product.stock) {
          addItem(updatedProduct, promoQty);
          notifySuccess(`${promoQty} ${product.title} added to cart!`);
          return;
        } else {
          notifyError("Insufficient stock!");
          return;
        }
      }
    }
    
    // Regular product (non-promo or already handled promo)
    if (result !== undefined) {
      // Already in cart
      if (
        result?.quantity + qty <=
        (product?.variants?.length > 0
          ? product?.variant?.quantity
          : product?.stock)
      ) {
        updateItemQuantity(product.id, result.quantity + qty);
        notifySuccess(`${qty} ${product.title} added to cart!`);
        
        // Dispatch cart updated event
        const cartEvent = new CustomEvent('cart-updated', {
          detail: { product, action: 'updated', quantity: result.quantity + qty }
        });
        window.dispatchEvent(cartEvent);
      } else {
        notifyError("Insufficient stock!");
      }
    } else {
      // Not in cart
      if (
        qty <=
        (product?.variants?.length > 0
          ? product?.variant?.quantity
          : product?.stock)
      ) {
        addItem(updatedProduct, qty);
        notifySuccess(`${qty} ${product.title} added to cart!`);
        
        // Dispatch cart updated event
        const cartEvent = new CustomEvent('cart-updated', {
          detail: { product, action: 'added', quantity: qty }
        });
        window.dispatchEvent(cartEvent);
      } else {
        notifyError("Insufficient stock!");
      }
    }
  };

  const handleIncreaseQuantity = (product) => {
    const result = items?.find((p) => p.id === product.id);
    
    if (result) {
      // Prevent quantity modifications for combo deals
      if (result.isCombo) {
        notifyError("Combo deals cannot be modified. Please remove and re-add if needed.");
        return;
      }
      
      // Check if item has promotion
      if (result.promotion) {
        const nextQuantity = result.quantity + 1;
        
        // Check stock availability
        if (nextQuantity <= product.stock) {
          // If we have maxQty limit and going beyond it, update price calculation in cart
          if (result.maxQty && nextQuantity > result.maxQty) {
            // Will automatically use blended price calculation from CartItem component
            updateItemQuantity(product.id, nextQuantity);
          } else {
            // Still within promotion quantity limits
            updateItemQuantity(product.id, nextQuantity);
          }
        } else {
          notifyError("Insufficient stock!");
        }
      } else {
        // Regular non-promotional item
        if (
          result?.quantity + 1 <=
          (product?.variants?.length > 0
            ? product?.variant?.quantity
            : product?.stock)
        ) {
          updateItemQuantity(product.id, product.quantity + 1);
        } else {
          notifyError("Insufficient stock!");
        }
      }
    }
  };

  return {
    setItem,
    item,
    handleAddItem,
    handleIncreaseQuantity,
  };
};

export default useAddToCart;
