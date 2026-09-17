"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TrackPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const search = useSearchParams();
  const businessId = search.get("businessId");
  const supabase = createClient();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderNumber) return;
      const { data } = await supabase.from("orders").select("*, customers(name,phone), order_items(*)").eq("order_number", orderNumber).maybeSingle();
      if (data) setOrder(data);
      setLoading(false);
    }
    load();
  }, [orderNumber]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading {orderNumber}...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center flex-col"><p className="font-bold">Order {orderNumber} not found</p><a href={businessId ? `/shop/${businessId}` : "/"} className="mt-2 text-sm text-purple-700">Back to shop</a></div>;

  const steps = [
    { key: "pending", label: "Order Placed", done: true },
    { key: "confirmed", label: "Confirmed", done: ["confirmed","packed","dispatched","delivered"].includes(order.delivery_status) || ["confirmed","processing","shipped","delivered"].includes(order.status) },
    { key: "packed", label: "Packed", done: ["packed","dispatched","delivered"].includes(order.delivery_status) },
    { key: "dispatched", label: "Out for Delivery", done: ["dispatched","delivered"].includes(order.delivery_status) },
    { key: "delivered", label: "Delivered", done: order.delivery_status==="delivered" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F1] p-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 mt-10 shadow-sm">
        <h1 className="font-black text-xl">RIRI Collection</h1>
        <p className="text-xs text-gray-500">Track Order {order.order_number}</p>
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm">
          <p><span className="text-gray-500">Customer:</span> {order.customers?.name} • {order.customers?.phone}</p>
          <p><span className="text-gray-500">Total:</span> ₦{Number(order.total).toLocaleString()} • {order.payment_status}</p>
          <p><span className="text-gray-500">Address:</span> {order.delivery_address}</p>
        </div>
        <div className="mt-6 space-y-3">
          {steps.map(s=>(
            <div key={s.key} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${s.done ? "bg-[#6B21A8] text-white" : "bg-gray-100 text-gray-400"}`}>{s.done ? "✓" : "○"}</div>
              <p className={`text-sm ${s.done ? "font-bold" : "text-gray-400"}`}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-xs font-bold uppercase text-gray-400">Items</p>
          {order.order_items?.map((it:any)=><div key={it.id} className="flex justify-between text-sm py-1"><span>{it.product_name} x{it.quantity}</span><span>₦{Number(it.line_total).toLocaleString()}</span></div>)}
        </div>
        <a href={businessId ? `/shop/${businessId}` : "/"} className="mt-6 block text-center w-full rounded-xl bg-black text-white py-3 text-sm font-bold">Back to Shop</a>
        <a href={`https://wa.me/${order.customers?.phone}`} className="mt-2 block text-center text-xs text-gray-400">Need help? Chat on WhatsApp</a>
      </div>
    </div>
  );
}