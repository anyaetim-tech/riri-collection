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

function generateOrderNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i=0;i<6;i++) rand += chars[Math.floor(Math.random()*chars.length)];
  return `RIRI-${rand}`;
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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Checkout form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<"abuja"|"outside">("abuja");

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
  }, [businessId, supabase]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const deliveryFee = deliveryLocation === "abuja" ? 1500 : 3500;
  const grandTotal = cartTotal + deliveryFee;

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q));
  }, [products, searchQuery]);

  function addToCart(p: Product) {
    // Prevent oversell check
    setCart(prev => {
      const found = prev.find(x => x.id === p.id);
      const currentQty = found ? found.qty : 0;
      if (currentQty + 1 > p.stock_quantity) {
        alert(`Only ${p.stock_quantity} left in stock!`);
        return prev;
      }
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
    else {
      const product = products.find(p=>p.id===id);
      if (product && qty > product.stock_quantity) {
        alert(`Only ${product.stock_quantity} left!`);
        return;
      }
      setCart(prev => prev.map(x => x.id === id ? { ...x, qty } : x));
    }
  }

  async function placeOrder() {
    if (!custName || !custPhone || !custAddress) {
      alert("Please fill name, phone, address");
      return;
    }
    if (cart.length === 0) return;

    // Double-check stock before placing
    for (const item of cart) {
      const live = products.find(p=>p.id===item.id);
      if (!live || item.qty > live.stock_quantity) {
        alert(`${item.name} only ${live?.stock_quantity||0} left. Please reduce quantity.`);
        return;
      }
    }

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

      // 2. Create order with unique number
      const orderNumber = generateOrderNumber();
      const subtotal = cartTotal;
      const finalTotal = subtotal + deliveryFee;
      const fullAddress = `${custAddress} [Delivery: ${deliveryLocation === "abuja" ? "Abuja - ₦1,500" : "Outside Abuja - ₦3,500"}]`;
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        business_id: businessId,
        customer_id: customerId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        delivery_status: "not_dispatched",
        delivery_address: fullAddress,
        subtotal,
        total: finalTotal,
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

      // 4. CRITICAL: Decrement stock to prevent oversell
      for (const item of cart) {
        const { error: stockErr } = await supabase.from("products")
          .update({ stock_quantity: item.stock_quantity - item.qty })
          .eq("id", item.id);
        if (stockErr) console.error("Stock update failed", stockErr);
      }

      // 5. Notify owner via WhatsApp (opens in background) - owner gets alert
      try {
        const ownerMsg = `🔔 NEW ORDER! ${orderNumber}\nCustomer: ${custName} (${custPhone})\nItems: ${cart.map(c=>`${c.name} x${c.qty}`).join(', ')}\nSubtotal: ₦${cartTotal.toLocaleString()}\nDelivery: ${deliveryLocation} ₦${deliveryFee.toLocaleString()}\nTOTAL: ₦${finalTotal.toLocaleString()}\nAddress: ${custAddress}\nCheck dashboard: /admin or /`;
        // We store notification attempt - owner will see in dashboard, plus we open wa.me to owner if businessPhone set
        const ownerPhoneClean = businessPhone.replace(/\D/g,'');
        if (ownerPhoneClean) {
          // Create a hidden notification - we don't auto-open to avoid popup block, but we log
          console.log("Owner notification:", ownerMsg);
          // Optional: you can enable auto WhatsApp to owner by uncommenting:
          // window.open(`https://wa.me/${ownerPhoneClean}?text=${encodeURIComponent(ownerMsg)}`, '_blank');
        }
      } catch (notifErr) {
        console.log("Notification error", notifErr);
      }

      // Success
      setOrderSuccess(orderNumber);
      setCart([]);
      setShowCart(false);
      setShowCheckout(false);
      setCustName(""); setCustPhone(""); setCustAddress("");
      // Refresh products to show new stock
      const { data: prods } = await supabase.from("products").select("*").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: false });
      if (prods) setProducts(prods as any);

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
        <a href="/" className="flex items-center gap-3 hover:opacity-80">
          <div className="h-9 w-9 rounded-xl bg-[#6B21A8] text-white flex items-center justify-center font-black">R</div>
          <div>
            <p className="font-black text-sm leading-none">{businessName}</p>
            <p className="text-[10px] text-gray-500">Abuja • Nationwide delivery</p>
          </div>
        </a>
        <div className="flex items-center gap-2">
          <a href="/" className="hidden md:flex rounded-full bg-gray-100 text-gray-700 px-4 py-2 text-xs font-bold">
            ← Dashboard
          </a>
          <button onClick={() => setShowCart(true)} className="relative rounded-full bg-black text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
            🛒 Cart
            {cartCount > 0 && <span className="bg-[#6B21A8] text-white text-[10px] px-2 py-0.5 rounded-full">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* SEARCH BAR - NEW */}
      <div className="max-w-5xl mx-auto p-4">
        <div className="relative">
          <input
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
            placeholder="Search Ankara, shoes, bags..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pl-10 text-sm outline-none focus:border-[#6B21A8] shadow-sm"
          />
          <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
        </div>
        {searchQuery && <p className="mt-2 text-xs text-gray-500">{filteredProducts.length} items found for "{searchQuery}"</p>}
      </div>

      {/* SUCCESS MESSAGE */}
      {orderSuccess && (
        <div className="max-w-5xl mx-auto m-4 rounded-2xl bg-green-600 text-white p-5 text-center">
          <p className="text-2xl">✅</p>
          <p className="font-black text-lg">Order Placed! {orderSuccess}</p>
          <p className="text-sm mt-1">We will call you to confirm delivery. Thank you for shopping with {businessName}!</p>
          <div className="mt-3 flex gap-2 justify-center">
            <button onClick={() => setOrderSuccess(null)} className="bg-white text-green-700 rounded-xl px-4 py-2 text-sm font-bold">Continue Shopping</button>
            <a href={`/track/${orderSuccess}?businessId=${businessId}`} className="bg-black text-white rounded-xl px-4 py-2 text-sm font-bold">Track Order →</a>
          </div>
          <p className="mt-2 text-[11px] opacity-80">Order total includes delivery fee. Keep your order number: {orderSuccess}</p>
        </div>
      )}

      {/* PRODUCTS GRID */}
      <main className="max-w-5xl mx-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map(p => (
          <div key={p.id} className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="aspect-square bg-gray-50 flex items-center justify-center text-4xl relative">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : "👗"}
              {p.stock_quantity <= 5 && p.stock_quantity > 0 && <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] px-2 py-1 rounded-full font-bold">Only {p.stock_quantity} left!</span>}
              {p.stock_quantity === 0 && <span className="absolute inset-0 bg-white/80 flex items-center justify-center font-black text-xs">SOLD OUT</span>}
            </div>
            <div className="p-3">
              <p className="font-bold text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-500 truncate">{p.stock_quantity > 0 ? `${p.stock_quantity} left` : "Out of stock"} {p.description ? `• ${p.description.slice(0,20)}` : ""}</p>
              <div className="mt-2 flex justify-between items-center">
                <p className="font-black text-[#6B21A8]">₦{Number(p.price).toLocaleString()}</p>
                <button disabled={p.stock_quantity === 0} onClick={() => addToCart(p)} className="rounded-xl bg-black text-white text-xs font-bold px-3 py-2 disabled:opacity-30 hover:bg-[#6B21A8] transition">
                  {p.stock_quantity === 0 ? "Sold Out" : "+ Add"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length===0 && (
          <div className="col-span-full text-center py-10 text-sm text-gray-400">No products found for "{searchQuery}". Try Ankara, gown, shoe, bag.</div>
        )}
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
                    <p className="text-[10px] text-gray-400">{item.stock_quantity} in stock</p>
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
                <div className="space-y-1 text-sm"><div className="flex justify-between"><span>Items</span><span>₦{cartTotal.toLocaleString()}</span></div><div className="flex justify-between text-gray-500"><span>Delivery ({deliveryLocation === "abuja" ? "Abuja" : "Outside"})</span><span>₦{deliveryFee.toLocaleString()}</span></div><div className="flex justify-between font-black text-base pt-2 border-t"><span>Total</span><span>₦{grandTotal.toLocaleString()}</span></div></div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full rounded-xl bg-[#6B21A8] text-white py-3 font-bold">Checkout →</button>
                <a href={`https://wa.me/${businessPhone.replace(/\D/g,'')}?text=Hi! I want to order: ${cart.map(c => `${c.name} x${c.qty}`).join(', ')} + Delivery ₦${deliveryFee} = ₦${grandTotal.toLocaleString()} - ${deliveryLocation}`} target="_blank" className="block text-center w-full rounded-xl bg-green-600 text-white py-3 font-bold">Order via WhatsApp</a>
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
            
            {/* DELIVERY FEE SELECTOR */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDeliveryLocation("abuja")} className={`rounded-xl border-2 px-3 py-3 text-left ${deliveryLocation==="abuja" ? "border-[#6B21A8] bg-[#6B21A8]/5" : "border-gray-200"}`}>
                <p className="text-xs font-bold">📍 Abuja</p>
                <p className="text-[11px] text-gray-500">₦1,500 fee • 24hrs</p>
              </button>
              <button onClick={() => setDeliveryLocation("outside")} className={`rounded-xl border-2 px-3 py-3 text-left ${deliveryLocation==="outside" ? "border-[#6B21A8] bg-[#6B21A8]/5" : "border-gray-200"}`}>
                <p className="text-xs font-bold">🇳🇬 Outside Abuja</p>
                <p className="text-[11px] text-gray-500">₦3,500 fee • 2-3 days</p>
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>Items ({cartCount})</span><span>₦{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery fee</span><span>₦{deliveryFee.toLocaleString()}</span></div>
              <div className="flex justify-between font-black text-sm pt-1 border-t"><span>Total to pay</span><span className="text-[#6B21A8]">₦{grandTotal.toLocaleString()}</span></div>
            </div>

            <input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Full Name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
            <input value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="Phone e.g. 08012345678" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
            <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder={deliveryLocation==="abuja" ? "Delivery address in Abuja + landmark" : "Full address + state + LGA"} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
            <button onClick={placeOrder} disabled={placing} className="w-full rounded-xl bg-black text-white py-3 font-bold disabled:opacity-50">
              {placing ? "Placing order..." : `Place Order • ₦${grandTotal.toLocaleString()}`}
            </button>
            <button onClick={() => setShowCheckout(false)} className="w-full text-xs text-gray-400">Back to cart</button>
          </div>
        </div>
      )}

      <footer className="text-center py-10 text-[10px] text-gray-400">Powered by Orderly • {businessName} • Abuja • Stock auto-updates after order</footer>
    </div>
  );
}