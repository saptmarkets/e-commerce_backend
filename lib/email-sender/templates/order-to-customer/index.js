const customerInvoiceEmailBody = (option) => {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Order Confirmation - ${option.invoice}</title>
    <style>
      /* Global styles */
      img {
        border: none;
        -ms-interpolation-mode: bicubic;
        max-width: 100%;
      }
      body {
        background-color: #f6f6f6;
        font-family: sans-serif;
        -webkit-font-smoothing: antialiased;
        font-size: 14px;
        line-height: 1.4;
        margin: 0;
        padding: 0;
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
      }
      table {
        border-collapse: separate;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        width: 100%;
      }
      table td {
        font-family: sans-serif;
        font-size: 14px;
        vertical-align: top;
      }
      /* Main styles */
      .body {
        background-color: #f6f6f6;
        width: 100%;
      }
      .container {
        display: block;
        margin: 0 auto !important;
        max-width: 580px;
        padding: 10px;
        width: 580px;
      }
      .content {
        box-sizing: border-box;
        display: block;
        margin: 0 auto;
        max-width: 580px;
        padding: 10px;
      }
      /* Header */
      .header {
        background-color: #2563eb;
        padding: 20px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        text-transform: uppercase;
      }
      /* Order info */
      .order-info {
        background-color: #ffffff;
        padding: 20px;
      }
      .order-details {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .info-label {
        font-weight: bold;
        color: #374151;
      }
      .info-value {
        color: #6b7280;
      }
      /* Product table */
      .product-table {
        width: 100%;
        margin: 20px 0;
        border-collapse: collapse;
      }
      .product-table th {
        background-color: #f3f4f6;
        padding: 12px 8px;
        text-align: left;
        font-weight: bold;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
      }
      .product-table td {
        padding: 12px 8px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }
      .product-name {
        font-weight: 500;
        color: #111827;
      }
      .unit-info {
        font-size: 12px;
        color: #3b82f6;
        margin-top: 4px;
      }
      .pack-info {
        font-size: 11px;
        color: #6b7280;
        margin-top: 2px;
      }
      /* Totals */
      .totals-section {
        background-color: #f9fafb;
        padding: 20px;
        border-radius: 8px;
        margin-top: 20px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 4px 0;
      }
      .total-row.final {
        border-top: 2px solid #d1d5db;
        padding-top: 8px;
        margin-top: 8px;
        font-weight: bold;
        font-size: 16px;
      }
      /* Footer */
      .footer {
        background-color: #374151;
        color: #ffffff;
        padding: 20px;
        text-align: center;
      }
      .verification-code {
        background-color: #dbeafe;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        padding: 15px;
        margin: 20px 0;
        text-align: center;
      }
      .verification-title {
        color: #1e40af;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 8px;
      }
      .verification-number {
        color: #1e40af;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 2px;
        font-family: monospace;
      }
    </style>
  </head>
  <body>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
      <tr>
        <td>&nbsp;</td>
        <td class="container">
          <div class="content">

            <!-- Header -->
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>

            <!-- Order Information -->
            <div class="order-info">
              <h2 style="margin-top: 0; color: #111827;">Thank you for your order!</h2>
              <p style="color: #6b7280;">Your order has been received and is being processed.</p>

              <div class="order-details">
                <div class="info-row">
                  <span class="info-label">Order Number:</span>
                  <span class="info-value">#${option.invoice}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">${option.date}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${option.method}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value">${option.status}</span>
                        </div>
              </div>

              <!-- Verification Code (if available) -->
              ${option.verificationCode ? `
                <div class="verification-code">
                  <div class="verification-title">🔐 Delivery Verification Code</div>
                  <div class="verification-number">${option.verificationCode}</div>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
                    Please provide this code to the delivery person upon arrival
                  </p>
                </div>
              ` : ''}

              <!-- Customer Information -->
              <h3 style="color: #111827; margin-bottom: 10px;">Delivery Information</h3>
              <div class="order-details">
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${option.name || ""}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${option.email || ""}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${option.phone || ""}</span>
      </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${option.address || ""}</span>
                </div>
      </div>

              <!-- Order Items -->
              <h3 style="color: #111827; margin-bottom: 15px;">Order Items</h3>
              <table class="product-table">
                              <thead>
                                <tr>
                    <th style="width: 50%;">Product</th>
                    <th style="width: 15%; text-align: center;">Quantity</th>
                    <th style="width: 17.5%; text-align: right;">Unit Price</th>
                    <th style="width: 17.5%; text-align: right;">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${option.cart
                                  .map((item) => {
                      // Get multi-unit information
                      const unitName = item.unitName || 'pcs';
                      const packQty = item.packQty || 1;
                      const totalBaseUnits = item.quantity * packQty;
                      const hasMultiUnit = packQty > 1;

                                    return `
                                <tr>
                          <td>
                            <div class="product-name">${item.title.substring(0, 40)}${item.title.length > 40 ? '...' : ''}</div>
                            ${hasMultiUnit ? `
                              <div class="unit-info">
                                Unit: ${unitName} (${packQty} pcs each)
                              </div>
                              <div class="pack-info">
                                Total pieces: ${totalBaseUnits}
                              </div>
                            ` : ''}
                                  </td>
                          <td style="text-align: center;">
                            <div>${item.quantity}</div>
                            ${hasMultiUnit ? `
                              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                                ${unitName}
                              </div>
                            ` : ''}
                                  </td>
                          <td style="text-align: right;">
                            <div>${option.currency}${item.price}</div>
                            ${hasMultiUnit ? `
                              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                                ${option.currency}${(item.price / packQty).toFixed(2)}/pc
                              </div>
                            ` : ''}
                                  </td>
                          <td style="text-align: right; font-weight: bold;">
                            ${option.currency}${(item.price * item.quantity).toFixed(2)}
                                  </td>
                                </tr>`;
                                  })
                                  .join("")}
                              </tbody>
                            </table>

              <!-- Order Totals -->
              <div class="totals-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${option.currency}${option.subTotal}</span>
                          </div>
                <div class="total-row">
                  <span>Shipping:</span>
                  <span>${option.currency}${option.shippingCost}</span>
                </div>
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-${option.currency}${option.discount}</span>
      </div>
                <div class="total-row final">
                  <span>Total:</span>
                  <span>${option.currency}${option.total}</span>
                </div>
                </div>

              <!-- Company Information -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h4 style="color: #111827; margin-bottom: 10px;">Contact Information</h4>
                <div class="order-details">
                  <div class="info-row">
                    <span class="info-label">Company:</span>
                    <span class="info-value">${option.company_name || ""}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${option.company_address || ""}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${option.company_phone || ""}</span>
                                    </div>
                  <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${option.company_email || ""}</span>
                          </div>
                </div>
      </div>
    </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 10px 0;">Thank you for shopping with us!</p>
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                If you have any questions, please contact our customer service team.
              </p>
            </div>

          </div>
        </td>
        <td>&nbsp;</td>
      </tr>
    </table>
  </body>
</html>`;
};

module.exports = customerInvoiceEmailBody;
