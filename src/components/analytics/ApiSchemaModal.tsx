import React, { useState } from "react";
import { X, Code2, Copy, Check, Database, Server, Sparkles } from "lucide-react";
import { EnterpriseAnalyticsSnapshot } from "../../types/analyticsDashboard";

interface ApiSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: EnterpriseAnalyticsSnapshot;
}

export const ApiSchemaModal: React.FC<ApiSchemaModalProps> = ({
  isOpen,
  onClose,
  snapshot,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"payload" | "sql" | "endpoints">("payload");

  if (!isOpen) return null;

  const jsonSnippet = JSON.stringify(
    {
      status: "success",
      timestamp: new Date().toISOString(),
      query: {
        outletName: snapshot.outletName,
        timeRangeType: snapshot.filter.type,
        customMode: snapshot.filter.customMode,
        startDate: snapshot.filter.startDate || snapshot.timeSeries[0]?.dateStr,
        endDate: snapshot.filter.endDate || snapshot.timeSeries[snapshot.timeSeries.length - 1]?.dateStr,
      },
      data: {
        periodSummary: {
          periodLabel: snapshot.periodLabel,
          outletName: snapshot.outletName,
          isSingleDay: snapshot.isSingleDay,
        },
        financials: snapshot.financials,
        orderVolume: snapshot.orderVolume,
        channels: snapshot.channels,
        paymentModes: snapshot.paymentModes,
        topSellingItems: snapshot.topSellingItems,
        slowMovingItems: snapshot.slowMovingItems,
        inventoryVariances: snapshot.inventoryVariances,
        timeSeries: snapshot.timeSeries.slice(0, 5), // Preview sample
      },
    },
    null,
    2
  );

  const sqlSnippet = `-- PostgreSQL / Cloud SQL Production Aggregation Queries

-- 1. Daily Financial & Channel Summary
SELECT 
  DATE(o.created_at) AS date_bucket,
  o.outlet_id,
  COUNT(o.id) AS total_orders,
  COUNT(CASE WHEN o.status = 'served' THEN 1 END) AS successful_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
  SUM(CASE WHEN o.status != 'cancelled' THEN o.subtotal ELSE 0 END) AS net_sales,
  SUM(CASE WHEN o.status != 'cancelled' THEN o.taxes ELSE 0 END) AS gst_collected,
  SUM(CASE WHEN o.status != 'cancelled' THEN o.grand_total ELSE 0 END) AS gross_revenue,
  SUM(CASE WHEN o.payment_method = 'upi' THEN o.grand_total ELSE 0 END) AS upi_collections,
  SUM(CASE WHEN o.payment_method = 'cash' THEN o.grand_total ELSE 0 END) AS cash_collections,
  SUM(CASE WHEN o.payment_method = 'card' THEN o.grand_total ELSE 0 END) AS card_collections
FROM orders o
WHERE o.created_at BETWEEN :start_date AND :end_date
  AND (:outlet_id = 'all' OR o.outlet_id = :outlet_id)
GROUP BY DATE(o.created_at), o.outlet_id
ORDER BY date_bucket ASC;

-- 2. Recipe Variance & Ingredient Wastage
SELECT 
  inv.ingredient_name,
  inv.category,
  inv.unit,
  SUM(bom.quantity_per_dish * oi.quantity) AS theoretical_usage,
  inv_draws.actual_qty_drawn AS actual_usage,
  (inv_draws.actual_qty_drawn - SUM(bom.quantity_per_dish * oi.quantity)) AS variance_qty,
  ((inv_draws.actual_qty_drawn - SUM(bom.quantity_per_dish * oi.quantity)) / NULLIF(SUM(bom.quantity_per_dish * oi.quantity), 0)) * 100 AS variance_percent,
  (inv_draws.actual_qty_drawn - SUM(bom.quantity_per_dish * oi.quantity)) * inv.unit_cost AS wastage_cost
FROM order_items oi
JOIN recipe_bom bom ON oi.menu_item_id = bom.menu_item_id
JOIN inventory_items inv ON bom.ingredient_id = inv.id
JOIN inventory_draw_logs inv_draws ON inv.id = inv_draws.ingredient_id
WHERE oi.created_at BETWEEN :start_date AND :end_date
GROUP BY inv.id, inv.ingredient_name, inv.category, inv.unit, inv.unit_cost, inv_draws.actual_qty_drawn;`;

  const endpointsSnippet = `REST API Contract Endpoints:

GET /api/v1/analytics/dashboard
Query Parameters:
  • outlet_id: "all" | "koramangala" | "indiranagar" | "whitefield"
  • type: "today" | "yesterday" | "7d" | "30d" | "this_month" | "single_date" | "date_range"
  • single_date?: "YYYY-MM-DD"
  • start_date?: "YYYY-MM-DD"
  • end_date?: "YYYY-MM-DD"

Response:
  • 200 OK -> EnterpriseAnalyticsSnapshot JSON

POST /api/v1/pos/sync-offline-batch
Body:
  • Array of PosSalesRecord (cash, upi, card, orders, cancellations)`;

  const handleCopy = () => {
    const textToCopy =
      activeTab === "payload"
        ? jsonSnippet
        : activeTab === "sql"
        ? sqlSnippet
        : endpointsSnippet;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#1E2B25] border border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#24332D]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#F5E086]/10 text-[#F5E086]">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                Backend Data Models & API Query Contracts
              </h3>
              <p className="text-xs text-white/60">
                JSON schema models, SQL aggregations, and backend endpoint specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-white/10 px-5 pt-3 bg-[#1A2520] gap-2 text-xs">
          <button
            onClick={() => setActiveTab("payload")}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "payload"
                ? "border-[#F5E086] text-[#F5E086]"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>API Response JSON Payload</span>
          </button>
          <button
            onClick={() => setActiveTab("sql")}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "sql"
                ? "border-[#F5E086] text-[#F5E086]"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SQL Database Queries</span>
          </button>
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`pb-2.5 px-3 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "endpoints"
                ? "border-[#F5E086] text-[#F5E086]"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>REST API Spec</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-5 flex-1 overflow-auto bg-[#141B18] font-mono text-xs text-emerald-300">
          <pre className="whitespace-pre leading-relaxed select-all">
            {activeTab === "payload" && jsonSnippet}
            {activeTab === "sql" && sqlSnippet}
            {activeTab === "endpoints" && endpointsSnippet}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#1A2520] flex items-center justify-between text-xs text-white/60">
          <span>Schema matches TypeScript interface <code className="text-[#F5E086]">EnterpriseAnalyticsSnapshot</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
