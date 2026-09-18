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
interface CartItem extends Product { qty: number; }

function generateOrderNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i=0;i<6;i++) rand += chars[Math.floor(Math.random()*chars.length)];
  return `RIRI-${rand}`;
}

function BankTransferCard({ amount, orderNumber }: { amount: number, orderNumber: string }) {
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const bankName = "Opay";
  const accountNumber = "9064301203";
  const accountName = "Riri collections";
  const whatsappNumber = "2349064301203";
  const copy = async (text: string) => { await navigator.clipboard.writeText(text); alert(`Copied: ${text}`); };
  const whatsappMessage = encodeURIComponent(`Hello Riri Collection! I just placed order ${orderNumber}. I have transferred ${formattedAmount} to ${bankName} ${accountNumber}. Here is my proof:`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  return (
    <div className="mt-4 bg-white rounded-2xl p-4 text-left text-black border border-black/10 shadow-sm">
      <h3 className="font-black text-base mb-1">💳 Pay via Bank Transfer</h3>
      <p className="text-[12px] text-gray-600 mb-3">Transfer and send proof on WhatsApp. We confirm fast.</p>
      <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-xl">
        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Amount to Pay</span><span className="font-black text-[#6B21A8]">{formattedAmount}</span></div>
        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Bank</span><span className="font-bold text-sm">{bankName}</span></div>
        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Account Number</span><div className="flex items-center gap-2"><span className="font-black text-base tracking-wider">{accountNumber}</span><button onClick={() => copy(accountNumber)} className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full">Copy</button></div></div>
        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Account Name</span><span className="font-bold text-sm">{accountName}</span></div>
        <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Reference</span><span className="font-mono font-black text-sm">{orderNumber}</span></div>
      </div>
      <div className="mt-3"><a href={whatsappLink} target="_blank" className="flex w-full bg-green-600 text-white text-center py-3 rounded-xl font-black text-sm justify-center hover:bg-green-700 transition">📱 Send Proof on WhatsApp</a></div>
    </div>
  );
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
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<"abuja"|"outside">("abuja");

  // LOAD PRODUCTS
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", businessId).single();
      if (biz) { setBusinessName(biz.name || "Riri Collection"); setBusinessPhone(biz.phone || ""); }
      const { data: prods } = await supabase.from("products").select("*").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: false });
      if (prods) setProducts(prods as any);
      setLoading(false);
    }
    if (businessId) load();
  }, [businessId, supabase]);

  // *** FIX: LOAD CART FROM LOCAL STORAGE WHEN YOU COME BACK ***
  useEffect(() => {
    if (!businessId) return;
    try {
      const saved = localStorage.getItem(`riri-cart-${businessId}`);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.log("No saved cart");
    }
  }, [businessId]);

  // *** FIX: SAVE CART TO LOCAL STORAGE ANYTIME IT CHANGES ***
  useEffect(() => {
    if (!businessId) return;
    try {
      localStorage.setItem(`riri-cart-${businessId}`, JSON.stringify(cart));
    } catch (e) {}
  }, [cart, businessId]);

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
    setCart(prev => {
      const found = prev.find(x => x.id === p.id);
      const currentQty = found ? found.qty : 0;
      if (currentQty + 1 > p.stock_quantity) { alert(`Only ${p.stock_quantity} left in stock!`); return prev; }
      if (found) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });
    setShowCart(true);
  }
  function removeFromCart(id: string) { setCart(prev => prev.filter(x => x.id !== id)); }
  function changeQty(id: string, qty: number) {
    if (qty <= 0) removeFromCart(id);
    else {
      const product = products.find(p=>p.id===id);
      if (product && qty > product.stock_quantity) { alert(`Only ${product.stock_quantity} left!`); return; }
      setCart(prev => prev.map(x => x.id === id ? { ...x, qty } : x));
    }
  }

  async function placeOrder() {
    if (!custName || !custPhone || !custAddress) { alert("Please fill name, phone, address"); return; }
    if (cart.length === 0) return;
    for (const item of cart) {
      const live = products.find(p=>p.id===item.id);
      if (!live || item.qty > live.stock_quantity) { alert(`${item.name} only ${live?.stock_quantity||0} left. Please reduce quantity.`); return; }
    }
    setPlacing(true);
    try {
      let customerId: string;
      const { data: existing } = await supabase.from("customers").select("id").eq("phone", custPhone).eq("business_id", businessId).maybeSingle();
      if (existing) customerId = existing.id;
      else {
        const { data: newCust, error: custErr } = await supabase.from("customers").insert({ business_id: businessId, name: custName, phone: custPhone, address: custAddress, }).select("id").single();
        if (custErr) throw custErr;
        customerId = newCust.id;
      }
      const orderNumber = generateOrderNumber();
      const subtotal = cartTotal;
      const finalTotal = subtotal + deliveryFee;
      setLastOrderTotal(finalTotal);
      const fullAddress = `${custAddress} [Delivery: ${deliveryLocation === "abuja" ? "Abuja - ₦1,500" : "Outside Abuja - ₦3,500"}]`;
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        business_id: businessId, customer_id: customerId, order_number: orderNumber, status: "pending", payment_status: "pending", delivery_status: "not_dispatched", delivery_address: fullAddress, subtotal, total: finalTotal, paid_amount: 0,
      }).select("id").single();
      if (orderErr) throw orderErr;
      const itemsToInsert = cart.map(c => ({ order_id: order.id, product_id: c.id, product_name: c.name, quantity: c.qty, unit_price: c.price, line_total: c.price * c.qty, }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
      for (const item of cart) {
        const { error: stockErr } = await supabase.from("products").update({ stock_quantity: item.stock_quantity - item.qty }).eq("id", item.id);
        if (stockErr) console.error("Stock update failed", stockErr);
      }
      setOrderSuccess(orderNumber);
      setCart([]);
      // Clear saved cart after order success
      localStorage.removeItem(`riri-cart-${businessId}`);
      setShowCheckout(false); setShowCart(false);
      setCustName(""); setCustPhone(""); setCustAddress("");
      const { data: prods } = await supabase.from("products").select("*").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: false });
      if (prods) setProducts(prods as any);
    } catch (e: any) { alert("Order failed: " + e.message); } finally { setPlacing(false); }
  }

  if (loading) return <div className="p-10 text-center">Loading {businessName}...</div>;

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center font-black text-sm">R</div>
            <div>
              <h1 className="font-black text-[15px] leading-none tracking-tight">{businessName}</h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">ABUJA • ANKARA & READY TO WEAR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search gowns, bags..." className="rounded-full bg-gray-100 px-4 py-2.5 pl-9 text-sm w-56 outline-none focus:bg-white focus:ring-2 focus:ring-black/10 transition" />
              <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
            </div>
            <a href={`/`} className="hidden md:flex text-xs font-black px-4 py-2.5 rounded-full bg-gray-100 hover:bg-black hover:text-white transition">Dashboard</a>
            <a href="/" className="hidden md:flex text-xs font-bold px-3 py-2.5 rounded-full border border-black/10 hover:bg-black hover:text-white transition">Home</a>
            <button onClick={() => setShowCart(true)} className="relative rounded-full bg-black text-white px-4 py-2.5 text-sm font-black flex items-center gap-1.5">
              🛒 <span className="hidden md:inline">Cart</span> {cartCount > 0 && <span className="bg-[#6B21A8] text-white text-[10px] h-5 min-w-5 px-1 flex items-center justify-center rounded-full">{cartCount}</span>}
            </button>
          </div>
        </div>
        <div className="md:hidden px-4 pb-3 flex gap-2">
          <div className="relative flex-1">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Ankara, gown..." className="rounded-full bg-gray-100 px-4 py-2.5 pl-9 text-sm w-full outline-none" />
            <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
          </div>
          <a href={`/`} className="text-xs font-black px-3 py-2.5 rounded-full bg-gray-100">Dashboard</a>
        </div>
      </header>

      {!orderSuccess && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="rounded-2xl bg-black text-white px-4 py-3 flex flex-wrap gap-3 items-center justify-between text-[11px]">
            <div className="flex gap-3">
              <span>📍 Abuja delivery ₦1,500 • 24hrs</span>
              <span className="hidden md:inline opacity-50">|</span>
              <span className="hidden md:inline">🇳🇬 Outside Abuja ₦3,500 • 2-3 days</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="bg-white text-black px-2.5 py-1 rounded-full font-black">💳 Opay 9064301203</span>
              <span className="bg-[#25D366] px-2.5 py-1 rounded-full font-bold">WhatsApp Proof</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 mt-4 flex justify-between items-center">
        <p className="text-xs text-gray-500"><span className="font-black text-black">{filteredProducts.length}</span> items • Tap + Add to shop</p>
        <p className="text-[10px] text-gray-400 hidden md:block">Pay via Bank Transfer • Secure • No online payment needed</p>
      </div>

      {orderSuccess && (
        <div className="max-w-3xl mx-auto m-4 rounded-[24px] bg-green-600 text-white p-5 md:p-6 text-center shadow-lg">
          <p className="text-3xl">✅</p>
          <p className="font-black text-lg mt-2">Order Placed! {orderSuccess}</p>
          <p className="text-sm mt-1 opacity-90">We will call you to confirm delivery. Thank you for shopping with {businessName}!</p>
          <BankTransferCard amount={lastOrderTotal} orderNumber={orderSuccess} />
          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={() => setOrderSuccess(null)} className="bg-white text-green-700 rounded-full px-5 py-2.5 text-sm font-black">Continue Shopping</button>
            <a href={`/track/${orderSuccess}?businessId=${businessId}`} className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-black">Track Order</a>
          </div>
          <p className="mt-3 text-[11px] opacity-70">Order total includes delivery fee. Keep your order number: {orderSuccess}</p>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {filteredProducts.map(p => (
          <div key={p.id} className="group rounded-[22px] bg-white border border-black/5 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="aspect-[4/5] bg-[#F8F6F3] flex items-center justify-center text-4xl relative overflow-hidden">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" loading="lazy" /> : <span className="opacity-30">👗</span>}
              {p.stock_quantity <= 5 && p.stock_quantity > 0 && <span className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-black shadow">Only {p.stock_quantity} left</span>}
              {p.stock_quantity === 0 && <span className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center font-black text-xs tracking-widest">SOLD OUT</span>}
            </div>
            <div className="p-3.5">
              <p className="font-bold text-[13px] leading-tight truncate">{p.name}</p>
              <p className="text-[11px] text-gray-400 mt-1">{p.stock_quantity > 0 ? `${p.stock_quantity} left` : "Out of stock"} {p.description ? `• ${p.description.slice(0,18)}` : ""}</p>
              <div className="mt-3 flex justify-between items-center">
                <p className="font-black text-[14px] tracking-tight">₦{Number(p.price).toLocaleString()}</p>
                <button disabled={p.stock_quantity === 0} onClick={() => addToCart(p)} className="rounded-full bg-black text-white text-[11px] font-black px-3.5 py-2 disabled:opacity-20 hover:bg-[#6B21A8] transition">
                  {p.stock_quantity === 0 ? "Sold Out" : "+ Add"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length===0 && (
          <div className="col-span-full text-center py-16 text-sm text-gray-400 rounded-3xl bg-white border border-dashed">No products for "{searchQuery}". Try Ankara, gown, shoe, bag.</div>
        )}
      </main>

      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-black">Your Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} className="h-8 w-8 rounded-full bg-gray-100">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.length === 0 ? <p className="text-sm text-gray-400 text-center mt-10">Cart empty. Add products!</p> : cart.map(item => (
                <div key={item.id} className="flex gap-3 border rounded-2xl p-3">
                  <div className="h-14 w-14 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : "👗"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs text-black font-black">₦{Number(item.price).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">{item.stock_quantity} in stock</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <button onClick={() => changeQty(item.id, item.qty - 1)} className="h-7 w-7 rounded-full bg-gray-100 font-bold">-</button>
                      <span className="text-xs font-black w-5 text-center">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, item.qty + 1)} className="h-7 w-7 rounded-full bg-gray-100 font-bold">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-[10px] text-red-500 font-bold">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t space-y-3 bg-gray-50/50">
                <div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-gray-500">Items</span><span className="font-bold">₦{cartTotal.toLocaleString()}</span></div><div className="flex justify-between text-gray-500"><span>Delivery ({deliveryLocation === "abuja" ? "Abuja" : "Outside"})</span><span>₦{deliveryFee.toLocaleString()}</span></div><div className="flex justify-between font-black text-base pt-2 border-t"><span>Total</span><span>₦{grandTotal.toLocaleString()}</span></div></div>
                <button onClick={() => { setShowCart(false); setShowCheckout(true); }} className="w-full rounded-full bg-black text-white py-3.5 font-black">Checkout →</button>
                <a href={`https://wa.me/${businessPhone.replace(/\D/g,'')}?text=Hi! I want to order: ${cart.map(c => `${c.name} x${c.qty}`).join(', ')} + Delivery ₦${deliveryFee} = ₦${grandTotal.toLocaleString()} - ${deliveryLocation}`} target="_blank" className="block text-center w-full rounded-full bg-[#25D366] text-white py-3.5 font-black">Order via WhatsApp</a>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-[28px] md:rounded-[24px] p-6 space-y-4 max-h-[92vh] overflow-auto shadow-2xl">
            <h3 className="font-black text-lg">Delivery Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDeliveryLocation("abuja")} className={`rounded-2xl border-2 px-3 py-3.5 text-left transition ${deliveryLocation==="abuja" ? "border-black bg-black text-white" : "border-gray-200"}`}>
                <p className="text-xs font-black">📍 Abuja</p><p className={`text-[11px] ${deliveryLocation==="abuja" ? "text-white/70" : "text-gray-500"}`}>₦1,500 fee • 24hrs</p>
              </button>
              <button onClick={() => setDeliveryLocation("outside")} className={`rounded-2xl border-2 px-3 py-3.5 text-left transition ${deliveryLocation==="outside" ? "border-black bg-black text-white" : "border-gray-200"}`}>
                <p className="text-xs font-black">🇳🇬 Outside Abuja</p><p className={`text-[11px] ${deliveryLocation==="outside" ? "text-white/70" : "text-gray-500"}`}>₦3,500 fee • 2-3 days</p>
              </button>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between"><span>Items ({cartCount})</span><span className="font-bold">₦{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Delivery fee</span><span>₦{deliveryFee.toLocaleString()}</span></div>
              <div className="flex justify-between font-black text-sm pt-2 border-t"><span>Total to pay</span><span>₦{grandTotal.toLocaleString()}</span></div>
            </div>
            <input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Full Name" className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition" />
            <input value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="Phone e.g. 08012345678" className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition" />
            <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder={deliveryLocation==="abuja" ? "Delivery address in Abuja + landmark" : "Full address + state + LGA"} rows={3} className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition" />
            <button onClick={placeOrder} disabled={placing} className="w-full rounded-full bg-black text-white py-4 font-black disabled:opacity-50 shadow-lg">
              {placing ? "Placing order..." : `Place Order • ₦${grandTotal.toLocaleString()}`}
            </button>
            <button onClick={() => setShowCheckout(false)} className="w-full text-xs text-gray-400 font-bold py-2">Back to cart</button>
          </div>
        </div>
      )}

      <footer className="text-center py-12 text-[10px] text-gray-400">Powered by Orderly • {businessName} • Abuja • Stock auto-updates • <a href={`/`} className="underline font-black">Dashboard</a></footer>
    </div>
  );
}