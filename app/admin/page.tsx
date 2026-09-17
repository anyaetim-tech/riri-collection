"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    let q = supabase.from("orders").select(`id, order_number, status, payment_status, delivery_status, total, total_amount, delivery_address, notes, created_at, customers ( name, phone, address ), order_items ( product_name, quantity, unit_price, line_total )`).order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("payment_status", filter);
    const { data } = await q;
    if (data) setOrders(data);
    setLoading(false);
  }

  useEffect(()=>{ load(); }, [filter]);

  async function updateStatus(id: string, field: string, value: string) {
    await supabase.from("orders").update({ [field]: value }).eq("id", id);
    load();
  }
  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;
    await supabase.from("order_items").delete().eq("order_id", id);
    await supabase.from("orders").delete().eq("id", id);
    load();
  }
  function waLink(phone: string, orderNo: string, total: number) {
    const clean = phone.replace(/\D/g,'');
    const num = clean.startsWith('0') ? '234'+clean.slice(1) : clean;
    const msg = `Hi, your order ${orderNo} of ₦${total.toLocaleString()} from RiriCollection is confirmed! Delivery in progress. Thanks!`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  const totalSales = orders.reduce((s,o)=>s+Number(o.total||o.total_amount||0),0);
  const pendingCount = orders.filter(o=>o.payment_status==='pending').length;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FAF7F1] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-black">RiriCollection — Pro Admin</h1>
            <p className="text-sm text-gray-500">Shop: https://riri-collection-plum.vercel.app/shop/09689ea5-f703-41bf-b7e2-b1c6a601258f</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white border rounded-xl px-4 py-2"><div className="text-xs text-gray-400">Total Sales</div><div className="font-black">₦{totalSales.toLocaleString()}</div></div>
            <div className="bg-white border rounded-xl px-4 py-2"><div className="text-xs text-gray-400">Pending</div><div className="font-black">{pendingCount}</div></div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {["all","pending","paid","partially_paid"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-full text-xs font-bold border ${filter===f?'bg-black text-white':'bg-white'}`}>{f.toUpperCase()}</button>
          ))}
          <button onClick={load} className="px-4 py-2 rounded-full text-xs font-bold border bg-white">↻ Refresh</button>
        </div>

        <div className="mt-6 grid gap-4">
          {orders.map(o=>(
            <div key={o.id} className="bg-white rounded-2xl border p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="font-black text-base">{o.order_number} — ₦{Number(o.total||o.total_amount||0).toLocaleString()}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{new Date(o.created_at).toLocaleString()} • {o.customers?.name} • {o.customers?.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">{o.delivery_address}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <select value={o.payment_status} onChange={e=>updateStatus(o.id,'payment_status',e.target.value)} className="text-xs border rounded px-2 py-1"><option>pending</option><option>paid</option><option>partially_paid</option><option>refunded</option></select>
                    <select value={o.delivery_status} onChange={e=>updateStatus(o.id,'delivery_status',e.target.value)} className="text-xs border rounded px-2 py-1"><option>not_dispatched</option><option>dispatched</option><option>delivered</option><option>failed</option></select>
                  </div>
                  <div className="flex gap-2">
                    <a href={waLink(o.customers?.phone||'', o.order_number, Number(o.total||0))} target="_blank" className="text-xs bg-[#25D366] text-white px-3 py-1 rounded-full font-bold">WhatsApp Customer</a>
                    <button onClick={()=>deleteOrder(o.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full">Delete</button>
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t pt-2">
                {o.order_items?.map((it:any,i:number)=>(<div key={i} className="text-xs flex justify-between py-1"><span>{it.product_name} x{it.quantity}</span><span>₦{Number(it.line_total).toLocaleString()}</span></div>))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}