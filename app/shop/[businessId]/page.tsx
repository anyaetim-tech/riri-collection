"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  description?: string;
  active: boolean;
}

interface CartItem extends Product {
  qty: number;
}

export default function ShopPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const supabase = useMemo(() => createClient(), []);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [businessName, setBusinessName] = useState("Riri Collection");
  const [businessPhone, setBusinessPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  
  // Checkout form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", businessId).single();
      if (biz) {
        setBusinessName(biz.name || "Riri Collection");
        setBusinessPhone(biz.phone || "");
      }
      const { data: prods } = await supabase.from("products").select("*").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: false });
      if (prods) setProducts(prods as any);
      setLoading(false);
    }
    if (businessId) load();
  }, [businessId]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(p: Product) {
    setCart(prev => {
      const found = prev.find(x => x.id === p.id);
      if (found) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });
    setShowCart(true);
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(x => x.id !== id));
  }

  function changeQty(id: string, qty: number) {
    if (qty <= 0) removeFromCart(id);
    else setCart(prev => prev.map(x => x.id === id ? { ...x, qty } : x));
  }

  async function placeOrder() {
    if (!custName || !custPhone || !custAddress) {
      alert("Please fill name, phone, address");
      return;
    }
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      // 1. Find or create customer by phone
      let customerId: string;
      const { data: existing } = await supabase.from("customers").select("id").eq("phone", custPhone).eq("business_id", businessId).maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: newCust, error: custErr } = await supabase.from("customers").insert({
          business_id: businessId,
          name: custName,
          phone: custPhone,
          address: custAddress,
        }).select("id").single();
        if (custErr) throw custErr;
        customerId = newCust.id;
      }

      // 2. Create order
      const orderNumber = `RIRI-${Date.now().toString().slice(-6)}`;
      const subtotal = cartTotal;
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        business_id: businessId,
        customer_id: customerId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        delivery_status: "not_dispatched",
        delivery_address: custAddress,
        subtotal,
        total: subtotal,
        paid_amount: 0,
      }).select("id").single();
      if (orderErr) throw orderErr;

      // 3. Create order_items
      const itemsToInsert = cart.map(c => ({
        order_id: order.id,
        product_id: c.id,
        product_name: c.name,
        quantity: c.qty,
        unit_price: c.price,
        line_total: c.price * c.qty,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      // Success
      setOrderSuccess(orderNumber);
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      setCustName(""); setCustPhone(""); setCustAddress("");
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1]"><p className="animate-pulse font-bold text-[#6B21A8]">Loading {businessName} shop...</p></div>;

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      {/* HEADER WITH CART BUTTON */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#6B21A8] text-white flex items-center justify-center font-black">R</div>
          <div>
            <p className="font-black text-sm leading-none">{businessName}</p>
            <p className="text-[10px] text-gray-500">Abuja • Nationwide delivery</p>
          </div>
        </div>
        <button onClick={() => setShowCart(true)} className="relative rounded-full bg-black text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
          🛒 Cart
          {cartCount > 0 && <span className="bg-[#6B21A8] text-white text-[10px] px-2 py-0.5 rounded-full">{cartCount}</span>}
        </button>
      </header>

      {/* SUCCESS MESSAGE */}
      {orderSuccess && (
        <div className="max-w-5xl mx-auto m-4 rounded-2xl bg-green-600 text-white p-5 text-center">
          <p className="text-2xl">✅</p>
          <p className="font-black text-lg">Order Placed! {orderSuccess}</p>
          <p className="text-sm mt-1">We will call you on {custPhone} to confirm delivery. Thank you for shopping with {businessName}!</p>
          <button onClick={() => setOrderSuccess(null)} className="mt-3 bg-white text-green-700 rounded-xl px-4 py-2 text-sm font-bold">Continue Shopping</button>
        </div>
      )}

      {/* PRODUCTS GRID */}
      <main className="max-w-5xl mx-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="aspect-square bg-gray-50 flex items-center justify-center text-4xl">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : "👗"}
            </div>
            <div className="p-3">
              <p className="font-bold text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-500 truncate">{p.stock_quantity > 0 ? `${p.stock_quantity} left` : "Out of stock"}</p>
              <div className="mt-2 flex justify-between items-center">
                <p className="font-black text-[#6B21A8]">₦{Number(p.price).toLocaleString()}</p>
                <button disabled={p.stock_quantity === 0} onClick={() => addToCart(p)} className="rounded-xl bg-black text-white text-xs font-bold px-3 py-2 disabled:opacity-30">
                  {p.stock_quantity === 0 ? "Sold Out" : "+ Add"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-sm bg-white h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-black">Your Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} className="h-8 w-8 rounded-full bg-gray-100">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.length === 0 ? <p className="text-sm text-gray-400 text-center mt-10">Cart empty. Add products!</p> : cart.map(item => (
                <div key={item.id} className="flex gap-3 border rounded-xl p-3">
                  <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : "👗"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs text-[#6B21A8] font-bold">₦{Number(item.price).toLocaleString()}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => changeQty(item.id, item.qty - 1)} className="h-6 w-6 rounded bg-gray-100">-</button>
                      <span className="text-xs font-bold">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, item.qty + 1)} className="h-6 w-6 rounded bg-gray-100">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-[10px] text-red-500">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t space-y-3">
                <div className="flex justify-between font-black"><span>Total</span><span>₦{cartTotal.toLocaleString()}</span></div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full rounded-xl bg-[#6B21A8] text-white py-3 font-bold">Checkout →</button>
                <a href={`https://wa.me/${businessPhone.replace(/\D/g,'')}?text=Hi! I want to order: ${cart.map(c => `${c.name} x${c.qty}`).join(', ')} = ₦${cartTotal.toLocaleString()}`} target="_blank" className="block text-center w-full rounded-xl bg-green-600 text-white py-3 font-bold">Order via WhatsApp</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCheckout(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-auto">
            <h3 className="font-black text-lg">Delivery Details</h3>
            <p className="text-xs text-gray-500">Order total ₦{cartTotal.toLocaleString()} for {cartCount} items. Pay on delivery.</p>
            <input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Full Name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
            <input value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="Phone e.g. 08012345678" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
            <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Delivery address in Abuja + landmark" rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
            <button onClick={placeOrder} disabled={placing} className="w-full rounded-xl bg-black text-white py-3 font-bold disabled:opacity-50">
              {placing ? "Placing order..." : `Place Order • ₦${cartTotal.toLocaleString()}`}
            </button>
            <button onClick={() => setShowCheckout(false)} className="w-full text-xs text-gray-400">Back to cart</button>
          </div>
        </div>
      )}

      <footer className="text-center py-10 text-[10px] text-gray-400">Powered by Orderly • {businessName} • Abuja</footer>
    </div>
  );
}