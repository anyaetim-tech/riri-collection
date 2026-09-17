"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; name: string; price: number; business_id: string; stock_quantity?: number; sku?: string; image_url?: string; description?: string };
type CartItem = Product & { qty: number };

// CHANGE THIS TO YOUR WHATSAPP NUMBER (with country code, no +) e.g. 2349064301203
const OWNER_WHATSAPP = "2349064301203";

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
  const [success, setSuccess] = useState<{orderNo: string, total: number} | null>(null);

  useEffect(() => {
    if (!businessId) return;
    async function load() {
      setLoading(true);
      const { data: biz } = await supabase.from("businesses").select("name").eq("id", businessId).single();
      if (biz) setBusinessName(biz.name);
      const { data: prods } = await supabase.from("products").select("id, name, price, business_id, stock_quantity, sku, active, image_url, description").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: false });
      if (prods) setProducts(prods as any);
      setLoading(false);
    }
    load();
  }, [businessId]);

  function addToCart(p: Product) {
    if ((p.stock_quantity||0) <=0) { alert(p.name + " out of stock"); return; }
    setCart(prev => {
      const found = prev.find(x => x.id === p.id);
      if (found) return prev.map(x => x.id === p.id ? { ...x, qty: Math.min(x.qty + 1, p.stock_quantity||100) } : x);
      return [...prev, { ...p, qty: 1 }];
    });
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s,i)=>s+i.qty,0);

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
      const orderNumber = `RIRI-${Date.now().toString().slice(-6)}`;
      const { data: order, error: oErr } = await supabase.from("orders").insert({
        business_id: businessId, customer_id: customerId, order_number: orderNumber,
        status: "new", payment_status: "pending", delivery_status: "not_dispatched",
        source: "whatsapp", subtotal: total, total: total, total_amount: total, delivery_fee: 0,
        delivery_address: customer.address.trim(), notes: `Customer: ${customer.name} - ${customer.phone} - Items: ${cart.map(c=>c.name+' x'+c.qty).join(', ')}`
      }).select("id, order_number").single();
      if (oErr) throw oErr;
      const items = cart.map(c => ({ order_id: order.id, product_id: c.id, product_name: c.name, quantity: c.qty, unit_price: c.price, line_total: c.price * c.qty }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;
      // Decrease stock
      for (let c of cart) {
        await supabase.from("products").update({ stock_quantity: Math.max(0, (c.stock_quantity||0) - c.qty) }).eq("id", c.id);
      }
      setSuccess({orderNo: order.order_number, total});
      setCart([]); 
    } catch (e: any) { alert("Could not place order: " + e.message); }
    finally { setPlacing(false); }
  }

  function openOwnerWhatsApp() {
    if (!success) return;
    const msg = `New order ${success.orderNo}%0AFrom: ${customer.name || 'Customer'}%0ATotal: ₦${success.total.toLocaleString()}%0ACheck admin: https://riri-collection-plum.vercel.app/admin`;
    window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${msg}`, "_blank");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1]">Loading {businessName}...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF7F1] flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] border p-8 max-w-md w-full text-center shadow">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-black mt-3">Order {success.orderNo} Placed!</h2>
          <p className="text-sm text-gray-500 mt-2">Total ₦{success.total.toLocaleString()}. We will contact you on WhatsApp shortly.</p>
          <div className="mt-6 space-y-3">
            <button onClick={openOwnerWhatsApp} className="w-full rounded-xl bg-[#25D366] py-3 font-bold text-white">Notify Vendor on WhatsApp →</button>
            <button onClick={()=>setSuccess(null)} className="w-full rounded-xl bg-gray-100 py-3 font-bold">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-[#6B21A8] text-white flex items-center justify-center font-bold">R</div><div><div className="font-bold">{businessName}</div><div className="text-xs text-gray-500">Abuja • Fast Delivery</div></div></div>
          <div className="text-sm font-bold bg-black text-white px-4 py-2 rounded-full">🛒 {totalItems} • ₦{total.toLocaleString()}</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black">Shop {businessName}</h2>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="rounded-2xl border bg-white p-3 shadow-sm flex flex-col">
                <div className="h-36 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover"/> : <span className="text-4xl">👗</span>}
                </div>
                <h3 className="mt-3 font-bold text-sm line-clamp-2">{p.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1">{p.stock_quantity||0} in stock • {p.sku||''}</p>
                <div className="mt-auto pt-3 flex justify-between items-center"><span className="font-black text-[#6B21A8]">₦{Number(p.price).toLocaleString()}</span><button onClick={() => addToCart(p)} className="rounded-xl bg-[#6B21A8] px-3 py-1.5 text-xs font-bold text-white">+ Add</button></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-[24px] border bg-white p-6 shadow-sm sticky top-24">
            <h3 className="font-bold">Your Order ({totalItems})</h3>
            {cart.length===0 ? <p className="mt-3 text-sm text-gray-400">Cart empty</p> : (
              <>
                <div className="mt-4 space-y-3 max-h-60 overflow-auto">
                  {cart.map(c => (<div key={c.id} className="flex justify-between text-sm"><span className="flex-1">{c.name} x{c.qty}</span><span>₦{(c.price*c.qty).toLocaleString()}</span></div>))}
                </div>
                <div className="mt-4 border-t pt-3 flex justify-between font-black"><span>Total</span><span>₦{total.toLocaleString()}</span></div>
                <div className="mt-6 space-y-3">
                  <input value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} placeholder="Full Name" className="w-full rounded-xl border px-4 py-3 text-sm"/>
                  <input value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} placeholder="WhatsApp Number (080...)" className="w-full rounded-xl border px-4 py-3 text-sm"/>
                  <input value={customer.address} onChange={e=>setCustomer({...customer, address:e.target.value})} placeholder="Delivery Address, Abuja" className="w-full rounded-xl border px-4 py-3 text-sm"/>
                  <button onClick={placeOrder} disabled={placing} className="w-full rounded-xl bg-[#6B21A8] py-3 text-sm font-bold text-white">{placing ? "Placing..." : "Place Order →"}</button>
                  <p className="text-[11px] text-center text-gray-400">Pay on delivery • Fast delivery in Abuja</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}