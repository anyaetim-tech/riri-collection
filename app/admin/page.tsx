"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get orders with customer info
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, payment_status, delivery_status, total, total_amount, delivery_address, notes, created_at,
          customers ( name, phone, address ),
          order_items ( product_name, quantity, unit_price, line_total )
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) console.log(error);
      if (data) setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-[#FAF7F1] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black">RiriCollection - Orders Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Latest orders from your shop</p>
        <p className="text-xs mt-2 bg-white border rounded p-2">Shop link: https://riri-collection-plum.vercel.app/shop/09689ea5-f703-41bf-b7e2-b1c6a601258f</p>
        
        <div className="mt-6 space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl border p-5 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{o.order_number} - ₦{Number(o.total||o.total_amount||0).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()} • {o.status} • {o.payment_status} • {o.delivery_status} • {o.source}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{o.customers?.name}</div>
                  <div className="text-xs">{o.customers?.phone}</div>
                  <div className="text-xs text-gray-500">{o.delivery_address || o.customers?.address}</div>
                </div>
              </div>
              <div className="mt-3 border-t pt-3">
                <div className="text-xs font-bold">Items:</div>
                {o.order_items?.map((it:any, idx:number) => (
                  <div key={idx} className="text-xs flex justify-between"><span>{it.product_name} x{it.quantity}</span><span>₦{Number(it.line_total).toLocaleString()}</span></div>
                ))}
              </div>
              {o.notes && <div className="mt-2 text-xs text-gray-400">{o.notes}</div>}
            </div>
          ))}
          {orders.length===0 && <p className="text-sm text-gray-400">No orders yet — place a test order from shop.</p>}
        </div>
      </div>
    </div>
  );
}