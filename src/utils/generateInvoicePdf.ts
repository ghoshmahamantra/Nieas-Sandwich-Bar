import { jsPDF } from "jspdf";
import { OrderRecord } from "../types/niea";

/**
 * Generates and downloads a clean, professional PDF invoice/receipt for an order.
 */
export function generateInvoicePdf(order: OrderRecord): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header - Brand Colors & Styling
  // Primary dark forest green banner
  doc.setFillColor(36, 51, 45); // #24332D
  doc.rect(0, 0, pageWidth, 28, "F");

  // Gold accent bar
  doc.setFillColor(245, 224, 134); // #F5E086
  doc.rect(0, 28, pageWidth, 2, "F");

  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(245, 224, 134);
  doc.text("NiEA'S SANDWICH BAR", 15, y);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(251, 249, 242);
  doc.text("Artisanal Sourdough Melts • Japanese Brioche • Specialty Brews", 15, y + 6);

  // Right-aligned "TAX INVOICE / RECEIPT"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(245, 224, 134);
  doc.text("ORDER RECEIPT", pageWidth - 15, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text(order.orderNumber, pageWidth - 15, y + 6, { align: "right" });

  y = 38;

  // Cafe Location & Contact Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Plot No. AA-I, Action Area 1, New Town, Kolkata, West Bengal - 700156\nFSSAI Lic: 22824012000491 • GSTIN: 19ABCDE1234F1Z5 • Phone: +91 82740 47424",
    15,
    y
  );

  y += 12;

  // Order Details Box
  doc.setFillColor(245, 247, 246);
  doc.setDrawColor(215, 222, 218);
  doc.roundedRect(15, y, pageWidth - 30, 24, 2, 2, "FD");

  const col1X = 20;
  const col2X = 85;
  const col3X = 145;

  doc.setFontSize(8.5);
  // Column 1
  doc.setTextColor(110, 110, 110);
  doc.text("Customer Name:", col1X, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(order.customerName || "Walk-in Guest", col1X, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Phone Number:", col1X, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(order.customerPhone ? `+91 ${order.customerPhone}` : "Not provided", col1X, y + 21);

  // Column 2
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Order Type:", col2X, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const typeText =
    order.orderType === "dine-in"
      ? `Dine-in (${order.tableNumber || "Table"})`
      : "Takeaway / Self-Pickup";
  doc.text(typeText, col2X, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Payment Method:", col2X, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(
    `${order.paymentMethod.toUpperCase()} (${order.paymentStatus === "paid" ? "Paid Online" : "Paid at Counter"})`,
    col2X,
    y + 21
  );

  // Column 3
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Date & Time:", col3X, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  let formattedDate = order.createdAt;
  try {
    formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    // fallback
  }
  doc.text(formattedDate, col3X, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Order Status:", col3X, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 139, 34); // Forest green
  doc.text(order.status.toUpperCase(), col3X, y + 21);

  y += 32;

  // Table Header
  doc.setFillColor(36, 51, 45);
  doc.rect(15, y, pageWidth - 30, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(245, 224, 134);
  doc.text("SL", 18, y + 5);
  doc.text("ITEM & SPECIFICATIONS", 30, y + 5);
  doc.text("QTY", 130, y + 5, { align: "center" });
  doc.text("PRICE", 155, y + 5, { align: "right" });
  doc.text("AMOUNT", pageWidth - 18, y + 5, { align: "right" });

  y += 7;

  // Items Rows
  doc.setFont("helvetica", "normal");
  order.items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 252);
    } else {
      doc.setFillColor(245, 248, 246);
    }
    const rowHeight =
      item.selectedCustomizations && item.selectedCustomizations.length > 0 ? 11 : 8.5;
    doc.rect(15, y, pageWidth - 30, rowHeight, "F");

    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`${index + 1}`, 18, y + 5.5);

    // Item name
    doc.setFont("helvetica", "bold");
    doc.text(item.item.name, 30, y + 5.5);

    // Bread and customizations on line 2 if present
    if (item.selectedCustomizations && item.selectedCustomizations.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      const customStr = item.selectedCustomizations.map((c) => c.name).join(", ");
      doc.text(
        `Bread: ${item.selectedBread || "Artisan Sourdough"} | Add-ons: ${customStr}`,
        30,
        y + 9.5
      );
    } else if (item.selectedBread && item.selectedBread !== "Default") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`Bread: ${item.selectedBread}`, 30, y + 9.5);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(String(item.quantity), 130, y + 5.5, { align: "center" });
    doc.text(`Rs. ${item.unitPrice}`, 155, y + 5.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${item.totalPrice}`, pageWidth - 18, y + 5.5, { align: "right" });

    y += rowHeight;
  });

  // Table bottom border
  doc.setDrawColor(215, 222, 218);
  doc.line(15, y, pageWidth - 15, y);

  y += 6;

  // Totals Section (Right side)
  const totalsX = 135;
  const valuesX = pageWidth - 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  doc.text("Items Subtotal:", totalsX, y);
  doc.text(`Rs. ${order.subtotal}`, valuesX, y, { align: "right" });
  y += 5;

  if (order.packagingCharge && order.packagingCharge > 0) {
    doc.text("Eco Packaging Charge:", totalsX, y);
    doc.text(`Rs. ${order.packagingCharge}`, valuesX, y, { align: "right" });
    y += 5;
  }

  doc.text("GST Taxes (5%):", totalsX, y);
  doc.text(`Rs. ${order.taxes}`, valuesX, y, { align: "right" });
  y += 5;

  if (order.tip && order.tip > 0) {
    doc.text("Crew & Kitchen Tip:", totalsX, y);
    doc.text(`Rs. ${order.tip}`, valuesX, y, { align: "right" });
    y += 5;
  }

  if (order.discount && order.discount > 0) {
    doc.setTextColor(190, 40, 40);
    doc.text("Loyalty Discount:", totalsX, y);
    doc.text(`- Rs. ${order.discount}`, valuesX, y, { align: "right" });
    y += 5;
  }

  // Grand Total box
  y += 2;
  doc.setFillColor(36, 51, 45);
  doc.roundedRect(totalsX - 5, y - 4, pageWidth - totalsX - 10, 9, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(245, 224, 134);
  doc.text("GRAND TOTAL:", totalsX, y + 2.5);
  doc.text(`Rs. ${order.grandTotal}`, valuesX, y + 2.5, { align: "right" });

  y += 18;

  // Loyalty Points or Feedback note if shared
  if (order.feedbackShared) {
    doc.setFillColor(245, 248, 246);
    doc.setDrawColor(245, 224, 134);
    doc.roundedRect(15, y, pageWidth - 30, 12, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(36, 51, 45);
    doc.text(
      `Customer Review Recorded: ${order.feedbackRating || 5}/5 Stars on ${order.feedbackPlatform || "Social Media"}`,
      20,
      y + 5
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const feedbackSnippet = order.feedbackComment ? `"${order.feedbackComment.slice(0, 85)}..."` : "";
    doc.text(feedbackSnippet, 20, y + 9);
    y += 18;
  }

  // Footer notes & greeting
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text(
    "Thank you for dining with NiEA'S Sandwich Bar! All sandwiches are toasted to order with small-batch sourdough.",
    15,
    y
  );
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "This is a computer generated invoice and does not require a physical signature.",
    15,
    y
  );

  // Save the PDF directly to device
  const filename = `NiEA_Invoice_${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  doc.save(filename);
}
