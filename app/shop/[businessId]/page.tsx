"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; name: string; price: number; business_id: string; stock_quantity?: number; sku?: string };
type CartItem = Product & { qty: number };

export default function PublicShopPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const supabase = createClient();
  const [businessName, setBusinessName] = useState("Riri Collection");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    async function load() {
      setLoading(true);
      const { data: biz } = await supabase.from("businesses").select("name").eq("id", businessId).single();
      if (biz) setBusinessName(biz.name);
      const { data: prods } = await supabase.from("products").select("id, name, price, business_id, stock_quantity, sku, active").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: false });
      if (prods) setProducts(prods as any);
      setLoading(false);
    }
    load();
  }, [businessId]);

  function addToCart(p: Product) {
    setCart(prev => {
      const found = prev.find(x => x.id === p.id);
      if (found) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });
  }
  function removeFromCart(id: string) { setCart(prev => prev.filter(x => x.id !== id)); }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  async function placeOrder() {
    if (!customer.name || !customer.phone) { alert("Enter your name and WhatsApp number"); return; }
    if (cart.length === 0) { alert("Cart empty"); return; }
    setPlacing(true);
    try {
      let customerId: string;
      const { data: existing } = await supabase.from("customers").select("id").eq("business_id", businessId).eq("phone", customer.phone.trim()).limit(1).single();
      if (existing) customerId = existing.id;
      else {
        const { data: newCust, error: cErr } = await supabase.from("customers").insert({ business_id: businessId, name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() }).select("id").single();
        if (cErr) throw cErr; customerId = newCust.id;
      }
      const { data: order, error: oErr } = await supabase.from("orders").insert({ business_id: businessId, customer_id: customerId, total_amount: total, status: "pending", delivery_address: customer.address.trim() }).select("id").single();
      if (oErr) throw oErr;
      const items = cart.map(c => ({ order_id: order.id, product_id: c.id, quantity: c.qty, price: c.price, business_id: businessId }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;
      setSuccess(`Order placed! Order #${order.id.slice(0,8)}. ${businessName} will contact you on WhatsApp at ${customer.phone} shortly.`);
      setCart([]); setCustomer({ name: "", phone: "", address: "" });
    } catch (e: any) { alert("Could not place order: " + e.message); }
    finally { setPlacing(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1]">Loading {businessName}...</div>;

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-[#6B21A8] text-white flex items-center justify-center font-bold">R</div><div><div className="font-bold">{businessName}</div><div className="text-xs text-gray-500">Powered by Riri Collection</div></div></div>
          <div className="text-sm font-bold">🛒 {cart.length} - ₦{total.toLocaleString()}</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black">Shop {businessName}</h2>
          <p className="text-sm text-gray-500 mt-1">Choose what you like — order goes directly to vendor on WhatsApp.</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-32 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-4xl">👗</div>
                <h3 className="mt-3 font-bold text-sm">{p.name}</h3>
                <p className="text-xs text-gray-400">{p.sku} • Stock: {p.stock_quantity||0}</p>
                <div className="mt-2 flex justify-between items-center"><span className="font-black text-[#6B21A8]">₦{Number(p.price).toLocaleString()}</span><button onClick={() => addToCart(p)} className="rounded-xl bg-[#6B21A8] px-3 py-1.5 text-xs font-bold text-white">+ Add</button></div>
              </div>
            ))}
            {products.length===0 && <p className="text-sm text-gray-400 col-span-full">No products yet — ID {businessId} has no active products.</p>}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-base">Your Order</h3>
            {cart.length===0 ? <p className="mt-3 text-sm text-gray-400">Cart empty — add items from left.</p> : (
              <>
                <div className="mt-4 space-y-3">
                  {cart.map(c => (<div key={c.id} className="flex justify-between text-sm"><span>{c.name} x{c.qty}</span><span className="flex items-center gap-2">₦{(c.price*c.qty).toLocaleString()}<button onClick={()=>removeFromCart(c.id)} className="text-red-500 text-xs">x</button></span></div>))}
                </div>
                <div className="mt-4 border-t pt-3 flex justify-between font-black"><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                <div className="mt-6 space-y-3">
                  <input value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} placeholder="Your Full Name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"/>
                  <input value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} placeholder="WhatsApp Number" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"/>
                  <input value={customer.address} onChange={e=>setCustomer({...customer, address:e.target.value})} placeholder="Delivery Address" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"/>
                  <button onClick={placeOrder} disabled={placing} className="w-full rounded-xl bg-[#6B21A8] py-3 text-sm font-bold text-white">{placing ? "Placing..." : "Place Order on WhatsApp →"}</button>
                </div>
              </>
            )}
            {success && <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">{success}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}