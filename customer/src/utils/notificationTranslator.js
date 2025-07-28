import useTranslation from "next-translate/useTranslation";

// Utility function to translate notification messages
export const translateNotification = (notification, t) => {
  if (!t) {
    // Fallback if translation function is not provided
    return {
      title: notification.title || notification.titleKey || '',
      message: notification.message || notification.messageKey || ''
    };
  }
  
  // If the notification has translation keys, use them
  if (notification.titleKey || notification.messageKey) {
    let translatedTitle = '';
    let translatedMessage = '';
    
    // Translate title
    if (notification.titleKey) {
      translatedTitle = t(`common:${notification.titleKey}`);
      
      // Interpolate title data if available
      if (notification.titleData) {
        Object.keys(notification.titleData).forEach(key => {
          const placeholder = `{${key}}`;
          translatedTitle = translatedTitle.replace(placeholder, notification.titleData[key]);
        });
      }
    }
    
    // Translate message
    if (notification.messageKey) {
      translatedMessage = t(`common:${notification.messageKey}`);
      
      // Interpolate message data if available
      if (notification.messageData) {
        Object.keys(notification.messageData).forEach(key => {
          const placeholder = `{${key}}`;
          const value = notification.messageData[key];
          if (value !== null && value !== undefined) {
            translatedMessage = translatedMessage.replace(placeholder, value);
          }
        });
      }
    }
    
    return {
      title: translatedTitle || notification.title || '',
      message: translatedMessage || notification.message || ''
    };
  }
  
  // Fallback for old notifications without translation keys
  // Try to match the message content to translation keys
  if (notification.message) {
    let translatedMessage = notification.message;
    
    // Check if it's an order verification message
    if (notification.message.includes('verification code') && notification.message.includes('order')) {
      // Extract order number and verification code
      const orderMatch = notification.message.match(/#(\d+)/);
      const codeMatch = notification.message.match(/verification code is (\d+)/);
      
      if (orderMatch && codeMatch) {
        const orderInvoice = orderMatch[1];
        const verificationCode = codeMatch[1];
        let translatedMessage = t('common:orderReceivedMessage');
        translatedMessage = translatedMessage.replace('{orderInvoice}', orderInvoice);
        translatedMessage = translatedMessage.replace('{verificationCode}', verificationCode);
        return {
          title: notification.title || '',
          message: translatedMessage
        };
      }
    }
    // Check if it's an order confirmed message
    else if (notification.message.includes('confirmed') && notification.message.includes('prepared')) {
      const orderMatch = notification.message.match(/#(\d+)/);
      if (orderMatch) {
        const orderInvoice = orderMatch[1];
        let translatedMessage = t('common:orderConfirmedMessage');
        translatedMessage = translatedMessage.replace('{orderInvoice}', orderInvoice);
        return {
          title: notification.title || '',
          message: translatedMessage
        };
      }
    }
    // Check if it's an order processing message
    else if (notification.message.includes('processed') && notification.message.includes('delivery')) {
      const orderMatch = notification.message.match(/#(\d+)/);
      if (orderMatch) {
        const orderInvoice = orderMatch[1];
        let translatedMessage = t('common:orderProcessingMessage');
        translatedMessage = translatedMessage.replace('{orderInvoice}', orderInvoice);
        return {
          title: notification.title || '',
          message: translatedMessage
        };
      }
    }
    // Check if it's an out for delivery message
    else if (notification.message.includes('out for delivery')) {
      const orderMatch = notification.message.match(/#(\d+)/);
      if (orderMatch) {
        const orderInvoice = orderMatch[1];
        let translatedMessage = t('common:outForDeliveryMessage');
        translatedMessage = translatedMessage.replace('{orderInvoice}', orderInvoice);
        return {
          title: notification.title || '',
          message: translatedMessage
        };
      }
    }
    // Check if it's an order delivered message
    else if (notification.message.includes('delivered') && notification.message.includes('Thank you')) {
      const orderMatch = notification.message.match(/#(\d+)/);
      if (orderMatch) {
        const orderInvoice = orderMatch[1];
        let translatedMessage = t('common:orderDeliveredMessage');
        translatedMessage = translatedMessage.replace('{orderInvoice}', orderInvoice);
        return {
          title: notification.title || '',
          message: translatedMessage
        };
      }
    }
    // Check if it's an order cancelled message
    else if (notification.message.includes('cancelled') && notification.message.includes('refunded')) {
      const orderMatch = notification.message.match(/#(\d+)/);
      if (orderMatch) {
        const orderInvoice = orderMatch[1];
        let translatedMessage = t('common:orderCancelledMessage');
        translatedMessage = translatedMessage.replace('{orderInvoice}', orderInvoice);
        return {
          title: notification.title || '',
          message: translatedMessage
        };
      }
    }
    
    // If no specific pattern matched, return original message
    return {
      title: notification.title || '',
      message: notification.message
    };
  }
  
  // Final fallback to original title and message
  return {
    title: notification.title || '',
    message: notification.message || ''
  };
};

// Hook to use notification translation
export const useNotificationTranslation = () => {
  const { t } = useTranslation("common");
  
  const translateNotificationMessage = (notification) => {
    return translateNotification(notification, t);
  };
  
  return { translateNotificationMessage };
}; 