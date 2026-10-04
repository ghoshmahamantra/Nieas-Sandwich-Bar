import { OrderRecord, WhatsAppTemplatesConfig } from "../types/niea";

export function formatOrderItemsSummary(order: OrderRecord): string {
  if (!order.items || order.items.length === 0) return "Artisanal Selection";
  return order.items
    .map(
      (it) =>
        `• ${it.quantity}x ${it.item.name}${
          it.selectedBread ? ` (${it.selectedBread})` : ""
        }`
    )
    .join("\n");
}

export function generateCustomerWhatsAppUrl(
  order: OrderRecord,
  config?: WhatsAppTemplatesConfig
): string {
  const cleanPhone = (order.customerPhone || "").replace(/\D/g, "").slice(-10);
  const itemsText = formatOrderItemsSummary(order);
  const orderTypeLabel =
    order.orderType === "dine-in"
      ? `Dine-in (${order.tableNumber || "Table 1"})`
      : "Artisan Takeaway";

  let msg = config?.orderCustomerTemplate || "";
  if (msg && msg.includes("{customerName}")) {
    msg = msg
      .replace(/\{customerName\}/g, order.customerName || "Valued Guest")
      .replace(/\{orderNumber\}/g, order.orderNumber)
      .replace(/\{tokenNumber\}/g, order.tokenNumber || order.orderNumber)
      .replace(/\{orderType\}/g, orderTypeLabel)
      .replace(/\{items\}/g, itemsText)
      .replace(/\{grandTotal\}/g, String(order.grandTotal))
      .replace(/\{estimatedTime\}/g, order.estimatedTime || "25 mins");
  } else {
    msg =
      `🐾 *NiEA'S SANDWICH BAR — Order Receipt*\n\n` +
      `Hello ${order.customerName || "Valued Guest"}!\n` +
      `Your order has been received by our kitchen.\n\n` +
      `🎫 *Token: ${order.tokenNumber || order.orderNumber}*\n` +
      `🏷️ Type: *${orderTypeLabel}*\n` +
      `⏱️ Estimated Waiting Time: *${order.estimatedTime || "25 mins"}*\n\n` +
      `📋 *Order Items:*\n${itemsText}\n\n` +
      `💰 Grand Total: ₹${order.grandTotal}\n` +
      `💳 Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus === "paid" ? "PAID ✅" : "PAY AT COUNTER"})\n\n` +
      `📍 *Pickup:* NiEA'S Sandwich Bar, Action Area 1, New Town, Kolkata\n` +
      `📞 Kitchen: +91 82740 47424\n\n` +
      `Your token *${order.tokenNumber || order.orderNumber}* will be called when hot & ready!`;
  }

  if (cleanPhone.length === 10) {
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function generateOwnerWhatsAppAlertUrl(
  order: OrderRecord,
  config?: WhatsAppTemplatesConfig
): string {
  const ownerPhone = (config?.ownerAlertPhone || "8274047424").replace(/\D/g, "").slice(-10);
  const itemsText = formatOrderItemsSummary(order);
  const orderTypeLabel =
    order.orderType === "dine-in"
      ? `Dine-in (${order.tableNumber || "Table 1"})`
      : "Takeaway";

  let msg = config?.ownerOrderAlertTemplate || "";
  if (msg && msg.includes("{customerName}")) {
    msg = msg
      .replace(/\{customerName\}/g, order.customerName || "Guest")
      .replace(/\{customerPhone\}/g, order.customerPhone)
      .replace(/\{orderNumber\}/g, order.orderNumber)
      .replace(/\{tokenNumber\}/g, order.tokenNumber || order.orderNumber)
      .replace(/\{orderType\}/g, orderTypeLabel)
      .replace(/\{items\}/g, itemsText)
      .replace(/\{grandTotal\}/g, String(order.grandTotal))
      .replace(/\{paymentMethod\}/g, order.paymentMethod.toUpperCase())
      .replace(/\{paymentStatus\}/g, order.paymentStatus.toUpperCase());
  } else {
    msg =
      `🚨 *NEW ORDER ALERT — NiEA'S KITCHEN*\n\n` +
      `🎫 *Token: ${order.tokenNumber || order.orderNumber}*\n` +
      `👤 Guest: *${order.customerName}* (+91 ${order.customerPhone})\n` +
      `🏷️ Type: *${orderTypeLabel}*\n` +
      `⏱️ Assigned Time: *${order.estimatedTime || "25 mins"}*\n\n` +
      `🍳 *Items for Kitchen:*\n${itemsText}\n\n` +
      `💵 Total: ₹${order.grandTotal} (${order.paymentMethod.toUpperCase()} - ${order.paymentStatus.toUpperCase()})\n` +
      `⏰ Time: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return `https://wa.me/91${ownerPhone}?text=${encodeURIComponent(msg)}`;
}

export function generateOrderReadyWhatsAppUrl(
  order: OrderRecord,
  config?: WhatsAppTemplatesConfig
): string {
  const cleanPhone = (order.customerPhone || "").replace(/\D/g, "").slice(-10);
  let msg = config?.orderReadyTemplate || "";
  if (msg && msg.includes("{customerName}")) {
    msg = msg
      .replace(/\{customerName\}/g, order.customerName || "Valued Guest")
      .replace(/\{orderNumber\}/g, order.orderNumber)
      .replace(/\{tokenNumber\}/g, order.tokenNumber || order.orderNumber);
  } else {
    msg =
      `🔔 *NiEA'S SANDWICH BAR — Your Order is Hot & Ready!* 🥪\n\n` +
      `Hello ${order.customerName || "Valued Guest"}!\n\n` +
      `✨ *Token Number: ${order.tokenNumber || order.orderNumber} is READY!*\n\n` +
      (order.orderType === "dine-in"
        ? `🪑 Your table (${order.tableNumber || "Table 1"}) is being served with your hot melts. Enjoy!`
        : `🛍️ Please collect your fresh hot takeaway parcel at the NiEA'S counter.\n\nShow token *${order.tokenNumber || order.orderNumber}* to the counter barista.`) +
      `\n\nThank you for dining at NiEA'S! 🐾`;
  }

  if (cleanPhone.length === 10) {
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function generateOrderCancellationRequestWhatsAppUrl(
  order: OrderRecord,
  config?: WhatsAppTemplatesConfig
): string {
  const ownerPhone = (config?.ownerAlertPhone || "8274047424").replace(/\D/g, "").slice(-10);
  const itemsText = formatOrderItemsSummary(order);
  const orderTypeLabel =
    order.orderType === "dine-in"
      ? `Dine-in (${order.tableNumber || "Table 1"})`
      : "Takeaway";

  const msg =
    `⚠️ *ORDER CANCELLATION REQUEST — NiEA'S SANDWICH BAR*\n\n` +
    `Hello NiEA'S Store Owner,\n` +
    `I would like to request cancellation for my order:\n\n` +
    `• *Order Number:* #${order.orderNumber}\n` +
    `• *Token Number:* ${order.tokenNumber || order.orderNumber}\n` +
    `• *Customer Name:* ${order.customerName || "Customer"}\n` +
    `• *Customer Phone:* +91 ${order.customerPhone || "N/A"}\n` +
    `• *Order Type:* ${orderTypeLabel}\n` +
    `• *Total Amount:* ₹${order.grandTotal}\n` +
    `• *Items:*\n${itemsText}\n\n` +
    `Please help cancel this order and assist with any refund or confirmation. Thank you! 🐾`;

  return `https://wa.me/91${ownerPhone}?text=${encodeURIComponent(msg)}`;
}
