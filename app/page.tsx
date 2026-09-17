"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// --- Types ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: string;
  business_id: string;
  customer_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  delivery_address?: string;
  delivery_fee?: number;
  subtotal: number;
  total: number;
  paid_amount: number;
  created_at: string;
  customers?: Customer | Customer[];
  order_items?: OrderItem[];
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  status: string;
  created_at: string;
  orders?: {
    order_number: string;
    payment_status: string;
    customers?: Customer | Customer[];
  };
}

interface InventoryMovement {
  id: string;
  movement_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  note?: string;
  order_id?: string;
  created_at: string;
}

// --- Navigation ---
const navigation = [
  { name: "Dashboard", icon: "▦" },
  { name: "Orders", icon: "□" },
  { name: "Customers", icon: "♙" },
  { name: "Products", icon: "◇" },
  { name: "Payments", icon: "◎" },
  { name: "Deliveries", icon: "→" },
  { name: "Settings", icon: "⚙" },
];

// --- Helper UI Components ---
function StatCard({
  title,
  value,
  change,
  description,
}: {
  title: string;
  value: string;
  change?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        {change && change !== "—" && (
          <span
            className={`text-xs font-semibold ${
              change.startsWith("+")
                ? "text-green-600"
                : change.startsWith("-")
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

function StockBadge({
  quantity,
  threshold,
}: {
  quantity: number;
  threshold: number;
}) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        Out of stock
      </span>
    );
  }
  if (quantity <= threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      In stock
    </span>
  );
}

function LoadingScreen({ message = "Loading Riri Collection..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#FAF7F1] p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6B21A8] text-2xl font-bold text-white shadow-lg animate-bounce">
        R
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-600">{message}</p>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // General App Errors / Confirmations
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  // --- Business Settings State ---
  const [businessName, setBusinessName] = useState("Riri Collection");
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessPhone, setBusinessPhone] = useState("");
  const [paystackPublicKey, setPaystackPublicKey] = useState("");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");
  const [businessCurrency, setBusinessCurrency] = useState("NGN");
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [savingBusiness, setSavingBusiness] = useState(false);
  // --- TEAM (SAFE) ---
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  async function loadTeam() {
    if (!businessId) return;
    setLoadingTeam(true);
    try {
      const { data } = await supabase.from("business_members").select("user_id, role, created_at").eq("business_id", businessId);
      if (data) setTeamMembers(data);
    } catch {}
    setLoadingTeam(false);
  }
  async function addTeamMember() {
    if (!newMemberEmail.trim() || !businessId) { setGlobalError("Enter staff email"); return; }
    setAddingMember(true);
    setGlobalError(null);
    try {
      const { data, error } = await supabase.rpc("add_team_member_by_email", { member_email: newMemberEmail.trim().toLowerCase(), target_business_id: businessId });
      if (error) throw error;
      alert((data as string) || "Added!");
      setNewMemberEmail("");
      loadTeam();
    } catch (e:any) {
      setGlobalError("Could not add: " + e.message);
    } finally { setAddingMember(false); }
  }
  useEffect(() => { if (active === "Settings" && businessId) loadTeam(); }, [active, businessId]);

  function formatCurrency(amount: number, businessCurrency) {
    const locale = businessCurrency === "NGN" ? "en-NG" : "en-US";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: businessCurrency || "NGN",
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${businessCurrency} ${Number(amount).toLocaleString()}`;
    }
  }

  function getCurrencySymbol(businessCurrency) {
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: businessCurrency || "NGN" }).formatToParts(0).find(p=>p.type==="currency")?.value || businessCurrency;
    } catch { return businessCurrency; }
  }

  function generateOrderNumber() {
    return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
  }

  function normalizeCustomer<T>(c: T | T[] | null | undefined): T | null {
    if (!c) return null;
    return Array.isArray(c) ? (c[0] ?? null) : c;
  }

  // --- BEST FEATURES: WhatsApp Receipt + Image Upload ---
  function buildWhatsAppMessage(order: Order) {
    const customer = normalizeCustomer(order.customers);
    const items = order.order_items || [];
    const itemsText = items.map(i => `• ${i.product_name} x${i.quantity} = ${formatCurrency(i.line_total, businessCurrency)}`).join("\n");
    const totalPaid = formatCurrency(Number(order.paid_amount || 0), businessCurrency);
    const total = formatCurrency(Number(order.total || 0), businessCurrency);
    const balance = formatCurrency(Number(order.total || 0) - Number(order.paid_amount || 0), businessCurrency);
    
    return `*${businessName}* - Receipt\n\n` +
      `Order: *${order.order_number}*\n` +
      `Customer: ${customer?.name || "Customer"}\n` +
      `Date: ${new Date(order.created_at).toLocaleDateString()}\n\n` +
      `${itemsText || `Total: ${total}`}\n\n` +
      `*Total: ${total}*\nPaid: ${totalPaid}\nBalance: ${balance}\n\n` +
      `Delivery: ${order.delivery_address || "Pickup"}\nStatus: ${order.delivery_status}\n\n` +
      `Thank you for shopping with ${businessName}! 💃`;
  }

  function sendWhatsAppReceipt(order: Order) {
    const customer = normalizeCustomer(order.customers);
    const phone = customer?.phone?.replace(/[^0-9]/g, "") || "";
    // Nigeria format: ensure 234
    let formattedPhone = phone;
    if (phone.startsWith("0")) formattedPhone = "234" + phone.slice(1);
    if (!phone.startsWith("234") && phone.length === 10) formattedPhone = "234" + phone;
    
    const message = encodeURIComponent(buildWhatsAppMessage(order));
    const url = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(url, "_blank");
  }

  function printReceipt(order: Order) {
    const customer = normalizeCustomer(order.customers);
    const w = window.open("", "_blank");
    if (!w) return;
    const items = order.order_items || [];
    const itemsHtml = items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product_name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(i.line_total, businessCurrency)}</td></tr>`).join("");
    
    w.document.write(`
      <html><head><title>${order.order_number}</title>
      <style>body{font-family:system-ui;padding:40px;max-width:600px;margin:auto} .header{border-bottom:2px solid #6B21A8;padding-bottom:16px;margin-bottom:24px} .badge{display:inline-block;background:#6B21A8;color:white;padding:4px 12px;border-radius:20px;font-size:12px}</style>
      </head><body>
        <div class="header">
          <h1 style="margin:0;color:#6B21A8">${businessName}</h1>
          <p style="margin:4px 0;color:#666">${businessPhone ? "Tel: "+businessPhone : ""}</p>
        </div>
        <h2>Receipt - ${order.order_number}</h2>
        <p><strong>Customer:</strong> ${customer?.name || "Customer"} (${customer?.phone || ""})<br/>
        <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}<br/>
        <strong>Payment:</strong> <span class="badge">${order.payment_status}</span> &nbsp; <strong>Delivery:</strong> ${order.delivery_status}</p>
        ${items.length ? `<table style="width:100%;border-collapse:collapse;margin:20px 0"><thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #6B21A8">Item</th><th style="text-align:center;padding:8px;border-bottom:2px solid #6B21A8">Qty</th><th style="text-align:right;padding:8px;border-bottom:2px solid #6B21A8">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>` : ""}
        <div style="text-align:right;margin-top:24px">
          <p><strong>Total: ${formatCurrency(Number(order.total), businessCurrency)}</strong><br/>Paid: ${formatCurrency(Number(order.paid_amount), businessCurrency)}<br/>Balance: ${formatCurrency(Number(order.total)-Number(order.paid_amount), businessCurrency)}</p>
        </div>
        <p style="margin-top:40px;text-align:center;color:#999;font-size:12px">Thank you for shopping with ${businessName}! 💃</p>
        <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  }


  // --- PAYSTACK PAYMENT LINK ---
  const [generatingPaystack, setGeneratingPaystack] = useState<string | null>(null);
  const [paystackLinks, setPaystackLinks] = useState<Record<string, string>>({});

  async function generatePaystackLink(order: Order) {
    const customer = normalizeCustomer(order.customers);
    const email = (customer as any)?.email || `${customer?.phone || "customer"}@riri.local`;
    const amount = Number(order.total) - Number(order.paid_amount || 0);
    if (amount <= 0) {
      setGlobalError("Order already fully paid");
      return;
    }
    if (!paystackSecretKey) {
      setGlobalError("Add your Paystack SECRET key in Settings first. Get it from paystack.com dashboard");
      setActive("Settings");
      return;
    }
    setGeneratingPaystack(order.id);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount,
          order_number: order.order_number,
          customer_name: customer?.name,
          business_name: businessName,
          secret_key: paystackSecretKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      
      setPaystackLinks(prev => ({ ...prev, [order.id]: data.authorization_url }));
      
      // Auto open and copy
      window.open(data.authorization_url, "_blank");
      await navigator.clipboard.writeText(data.authorization_url).catch(()=>{});
      
      // Also share via WhatsApp with payment link
      const phone = customer?.phone?.replace(/[^0-9]/g, "") || "";
      let formattedPhone = phone;
      if (phone.startsWith("0")) formattedPhone = "234" + phone.slice(1);
      const message = encodeURIComponent(
        `Hi ${customer?.name || ""}! 👋\n\nYour order *${order.order_number}* from *${businessName}* is ready.\n\nAmount due: *${formatCurrency(amount, businessCurrency)}*\n\nPay securely here:\n${data.authorization_url}\n\nThank you! 💃`
      );
      if (formattedPhone) {
        window.open(`https://wa.me/${formattedPhone}?text=${message}`, "_blank");
      }
    } catch (e: any) {
      setGlobalError(e.message);
    } finally {
      setGeneratingPaystack(null);
    }
  }


  async function uploadProductImage(file: File, businessId: string): Promise<string | null> {
    try {
      setUploadingImage(true);
      const ext = file.name.split(".").pop();
      const fileName = `${businessId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e: any) {
      setGlobalError(e.message || "Image upload failed. Create a 'product-images' bucket in Supabase Storage and make it public.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }



  // --- Domain Data States ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<Order[]>([]);

  // Filters & Selected Models
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("other");
  const [savingPayment, setSavingPayment] = useState(false);

  // Customer History Modal State
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);

  // Dates & Metrics - FIXED: No new Date() in render (Next.js 15 blocking)
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [today, setToday] = useState<Date>(() => new Date(0));
  const [yesterday, setYesterday] = useState<Date>(() => {
    const d = new Date(0);
    d.setDate(d.getDate() - 1);
    return d;
  });
  useEffect(() => {
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    setCurrentDate(now);
    setToday(now);
    setYesterday(yest);
  }, []);

  const todaySales = orders
    .filter(
      (order) =>
        new Date(order.created_at).toDateString() === today.toDateString()
    )
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const yesterdaySales = orders
    .filter(
      (order) =>
        new Date(order.created_at).toDateString() === yesterday.toDateString()
    )
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const salesChange =
    yesterdaySales === 0
      ? todaySales > 0
        ? 100
        : 0
      : ((todaySales - yesterdaySales) / yesterdaySales) * 100;

  // Loaders Loading States
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Product History Modal State
  const [selectedProductHistory, setSelectedProductHistory] = useState<
    InventoryMovement[]
  >([]);
  const [showProductHistory, setShowProductHistory] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  const [loadingProductHistory, setLoadingProductHistory] = useState(false);

  // Product Metrics
  const totalProducts = products.length;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock_quantity ?? 0) > 0 &&
      Number(product.stock_quantity ?? 0) <=
        Number(product.low_stock_threshold ?? 5)
  ).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock_quantity ?? 0) === 0
  ).length;

  const lowStockProductList = products.filter(
    (product) =>
      Number(product.stock_quantity ?? 0) > 0 &&
      Number(product.stock_quantity ?? 0) <=
        Number(product.low_stock_threshold ?? 5)
  );

  const outOfStockProductList = products.filter(
    (product) => Number(product.stock_quantity ?? 0) === 0
  );

  const totalStockUnits = products.reduce(
    (sum, product) => sum + Number(product.stock_quantity ?? 0),
    0
  );

  // Delivery Search & Filters
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("all");

  // Form States
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  // image states already added above
  const [productPrice, setProductPrice] = useState("");
  const [productCostPrice, setProductCostPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<Product | null>(
    null
  );
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockingProduct, setRestockingProduct] = useState(false);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [orderCustomerId, setOrderCustomerId] = useState("");
  const [orderCustomerName, setOrderCustomerName] = useState("");
  const [orderCustomerPhone, setOrderCustomerPhone] = useState("");
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderPaidAmount, setOrderPaidAmount] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderPaymentStatus, setOrderPaymentStatus] = useState("pending");
  const [orderDeliveryStatus, setOrderDeliveryStatus] = useState("not_dispatched");
  const [savingOrder, setSavingOrder] = useState(false);

  // --- API Actions ---
  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, business_id, customer_id, order_number, status, payment_status, delivery_status,
          delivery_address, subtotal, total, paid_amount, created_at,
          customers ( name, phone ),
          order_items ( id, product_id, product_name, quantity, unit_price, line_total )
        `)
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw new Error(error.message);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setSelectedOrder((prev) =>
        prev?.id === orderId ? { ...prev, status: newStatus } : prev
      );
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Could not update order status."
      );
    }
  }

  async function loadCustomers() {
    setLoadingCustomers(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, address, notes, created_at")
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadCustomerHistory(customerId: string) {
    setLoadingCustomerOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, total, paid_amount, payment_status, delivery_status, created_at
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      setCustomerOrders(data || []);
    } catch (error) {
      console.error("Error loading customer history:", error);
      setCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
    }
  }

  async function loadPayments() {
    setLoadingPayments(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const { data, error } = await supabase
        .from("payments")
        .select(`
          id, amount, method, reference, status, created_at,
          orders ( order_number, payment_status, customers ( name, phone ) )
        `)
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      setPayments(data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function saveProduct() {
    if (!productName.trim() || !productPrice.trim()) {
      setGlobalError("Product name and selling price are required.");
      return;
    }
    const priceValue = Number(productPrice);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setGlobalError("Please enter a valid selling price.");
      return;
    }
    setSavingProduct(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const payload = {
        business_id: membership.business_id,
        name: productName.trim(),
        sku: productSku.trim() || null,
        price: priceValue,
        cost_price: productCostPrice.trim() ? Number(productCostPrice) : null,
        stock_quantity: Number(productStock || 0),
        low_stock_threshold: Number(lowStockThreshold || 0),
      };

      if (editingProductId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProductId)
          .eq("business_id", membership.business_id);
        if (error) throw new Error(error.message);
      } else {
        let imageUrl = null;
        if (productImageFile && businessId) {
          imageUrl = await uploadProductImage(productImageFile, businessId);
        }
        const { error } = await supabase.from("products").insert({
          ...payload,
          active: true,
          image_url: imageUrl,
        });
        if (error) throw new Error(error.message);
      }

      cancelProductForm();
      loadProducts();
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the product."
      );
    } finally {
      setSavingProduct(false);
    }
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name || "");
    setProductSku(product.sku || "");
    setProductPrice(product.price != null ? String(product.price) : "");
    setProductCostPrice(
      product.cost_price != null ? String(product.cost_price) : ""
    );
    setProductStock(
      product.stock_quantity != null ? String(product.stock_quantity) : ""
    );
    setLowStockThreshold(
      product.low_stock_threshold != null
        ? Number(product.low_stock_threshold)
        : 5
    );
    setShowProductForm(true);
  }

  function cancelProductForm() {
    setProductImageFile(null);
    setProductImagePreview(null);

    setEditingProductId(null);
    setProductName("");
    setProductSku("");
    setProductPrice("");
    setProductCostPrice("");
    setProductStock("");
    setLowStockThreshold(5);
    setShowProductForm(false);
  }

  async function deleteProduct(productId: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? Past orders referencing it will remain intact."
      )
    ) {
      return;
    }
    setDeletingProductId(productId);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw new Error(error.message);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Could not delete this product."
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, sku, price, cost_price, stock_quantity, low_stock_threshold, active, created_at, updated_at"
        )
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadProductHistory(product: Product) {
    setLoadingProductHistory(true);
    setHistoryProduct(product);
    setHistoryTypeFilter("all");

    try {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select(`
          id, movement_type, quantity, stock_before, stock_after, note, order_id, created_at
        `)
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setSelectedProductHistory(data || []);
      setShowProductHistory(true);
    } catch (error) {
      console.error("Error loading product history:", error);
      setGlobalError("Could not load inventory history.");
    } finally {
      setLoadingProductHistory(false);
    }
  }

  async function restockProduct(productId: string, quantity: number) {
    try {
      const { error } = await supabase.rpc("restock_product", {
        p_product_id: productId,
        p_quantity: quantity,
      });

      if (error) throw new Error(error.message);
      await loadProducts();
    } catch (error) {
      console.error("Error restocking product:", error);
      setGlobalError(
        error instanceof Error ? error.message : "Failed to restock product."
      );
    }
  }

  function openRestockModal(product: Product) {
    setRestockTargetProduct(product);
    setRestockQuantity("");
    setShowRestockModal(true);
  }

  function closeRestockModal() {
    if (restockingProduct) return;
    setShowRestockModal(false);
    setRestockTargetProduct(null);
    setRestockQuantity("");
  }

  async function submitRestock() {
    if (!restockTargetProduct) return;
    const amount = Number(restockQuantity);
    if (!Number.isInteger(amount) || amount < 1) {
      setGlobalError("Please enter a valid whole number greater than 0.");
      return;
    }
    setRestockingProduct(true);
    try {
      await restockProduct(restockTargetProduct.id, amount);
      setShowRestockModal(false);
      setRestockTargetProduct(null);
      setRestockQuantity("");
    } finally {
      setRestockingProduct(false);
    }
  }

  async function loadDeliveries() {
    setLoadingDeliveries(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, delivery_status, delivery_address, delivery_fee, created_at,
          customers ( name, phone )
        `)
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error loading deliveries:", error);
    } finally {
      setLoadingDeliveries(false);
    }
  }

  async function updateDeliveryStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_status: newStatus })
        .eq("id", orderId);

      if (error) throw new Error(error.message);

      setDeliveries((prev) =>
        prev.map((d) => (d.id === orderId ? { ...d, delivery_status: newStatus } : d))
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, delivery_status: newStatus } : o))
      );
      setSelectedOrder((prev) =>
        prev?.id === orderId ? { ...prev, delivery_status: newStatus } : prev
      );
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Could not update delivery status."
      );
    }
  }

  async function saveCustomer() {
    if (!customerName.trim() || !customerPhone.trim()) {
      setGlobalError("Customer name and phone are required.");
      return;
    }
    setSavingCustomer(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setGlobalError("You are not logged in.");
        return;
      }
      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const payload = {
        business_id: membership.business_id,
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || null,
        address: customerAddress.trim() || null,
        notes: customerNote.trim() || null,
      };

      if (editingCustomerId) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", editingCustomerId)
          .eq("business_id", membership.business_id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw new Error(error.message);
      }

      await loadCustomers();
      cancelCustomerForm();
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the customer."
      );
    } finally {
      setSavingCustomer(false);
    }
  }

  function startEditCustomer(customer: Customer) {
    setEditingCustomerId(customer.id);
    setCustomerName(customer.name || "");
    setCustomerPhone(customer.phone || "");
    setCustomerEmail(customer.email || "");
    setCustomerAddress(customer.address || "");
    setCustomerNote(customer.notes || "");
    setShowCustomerForm(true);
  }

  function cancelCustomerForm() {
    setEditingCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setCustomerNote("");
    setShowCustomerForm(false);
  }

  async function deleteCustomer(customerId: string) {
    if (
      !window.confirm(
        "Delete this customer? Customers with existing active orders cannot be deleted."
      )
    ) {
      return;
    }
    setDeletingCustomerId(customerId);
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId)
        .eq("business_id", membership?.business_id || businessId);
      if (error) throw new Error(error.message);

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
        setCustomerOrders([]);
      }
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Could not delete this customer. They may have active orders."
      );
    } finally {
      setDeletingCustomerId(null);
    }
  }

  async function saveOrder() {
    if (
      !orderCustomerName.trim() ||
      !orderCustomerPhone.trim() ||
      !orderProductId ||
      !orderAmount.trim()
    ) {
      setGlobalError("Customer name, phone, product, and order amount are required.");
      return;
    }
    const totalAmount = Number(orderAmount);
    const paidAmount = Number(orderPaidAmount || 0);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setGlobalError("Please enter a valid order amount.");
      return;
    }
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      setGlobalError("Please enter a valid paid amount.");
      return;
    }
    if (paidAmount > totalAmount) {
      setGlobalError("Paid amount cannot be greater than the order total.");
      return;
    }

    setSavingOrder(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      const { data: membership, error: membershipError } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership?.business_id) {
        throw new Error("Business could not be found.");
      }

      const selectedProduct = products.find((p) => p.id === orderProductId);
      if (!selectedProduct) {
        throw new Error("Selected product could not be found.");
      }

      if (editingOrderId) {
        const quantity = Number(orderQuantity || 1);
        let customerId = orderCustomerId;
        if (!customerId) {
          const { data: existingCustomers } = await supabase
            .from("customers")
            .select("id")
            .eq("business_id", membership.business_id)
            .eq("phone", orderCustomerPhone.trim())
            .limit(1);
          customerId = existingCustomers?.[0]?.id || "";
        }

        if (!customerId) {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({
              business_id: membership.business_id,
              name: orderCustomerName.trim(),
              phone: orderCustomerPhone.trim(),
            })
            .select("id")
            .single();
          customerId = newCustomer?.id;
        }

        const { error: updateError } = await supabase.rpc(
          "update_order_with_inventory",
          {
            p_business_id: membership.business_id,
            p_order_id: editingOrderId,
            p_customer_id: customerId,
            p_product_id: selectedProduct.id,
            p_product_name: selectedProduct.name,
            p_quantity: quantity,
            p_unit_price: Number(selectedProduct.price),
            p_line_total: totalAmount,
            p_payment_status: orderPaymentStatus,
            p_delivery_status: orderDeliveryStatus,
            p_delivery_address: orderAddress.trim() || null,
            p_subtotal: totalAmount,
            p_total: totalAmount,
            p_paid_amount: paidAmount,
          }
        );

        if (updateError) throw new Error(updateError.message);
      } else {
        const { data: existingCustomers } = await supabase
          .from("customers")
          .select("id")
          .eq("business_id", membership.business_id)
          .eq("phone", orderCustomerPhone.trim())
          .limit(1);
        let customerId = existingCustomers?.[0]?.id;

        if (!customerId) {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({
              business_id: membership.business_id,
              name: orderCustomerName.trim(),
              phone: orderCustomerPhone.trim(),
            })
            .select("id")
            .single();
          customerId = newCustomer?.id;
          await loadCustomers();
        }

        const orderNumber = generateOrderNumber();
        const { error: rpcError } = await supabase.rpc(
          "create_order_with_payment",
          {
            p_business_id: membership.business_id,
            p_customer_id: customerId,
            p_order_number: orderNumber,
            p_status: "confirmed",
            p_payment_status: orderPaymentStatus,
            p_delivery_status: orderDeliveryStatus,
            p_delivery_address: orderAddress.trim() || null,
            p_subtotal: totalAmount,
            p_total: totalAmount,
            p_paid_amount: paidAmount,
            p_product_id: selectedProduct.id,
            p_product_name: selectedProduct.name,
            p_quantity: Number(orderQuantity),
            p_unit_price: Number(selectedProduct.price),
            p_line_total: totalAmount,
            p_payment_method: "other",
          }
        );

        if (rpcError) throw new Error(rpcError.message);
      }

      await Promise.all([
        loadOrders(),
        loadPayments(),
        loadCustomers(),
        loadProducts(),
      ]);
      cancelOrderForm();
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the order."
      );
    } finally {
      setSavingOrder(false);
    }
  }

  function startEditOrder(order: Order) {
    const customer = normalizeCustomer(order.customers);
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const firstItem = items[0];

    setEditingOrderId(order.id);
    setOrderCustomerId(order.customer_id || "");
    setOrderCustomerName(customer?.name || "");
    setOrderCustomerPhone(customer?.phone || "");
    setOrderProductId(firstItem?.product_id || "");
    setOrderQuantity(
      firstItem?.quantity != null ? String(firstItem.quantity) : "1"
    );
    setOrderAmount(order.total != null ? String(order.total) : "");
    setOrderPaidAmount(order.paid_amount != null ? String(order.paid_amount) : "");
    setOrderAddress(order.delivery_address || "");
    setOrderPaymentStatus(order.payment_status || "pending");
    setOrderDeliveryStatus(order.delivery_status || "not_dispatched");
    setShowOrderForm(true);
  }

  function cancelOrderForm() {
    setEditingOrderId(null);
    setOrderCustomerId("");
    setOrderCustomerName("");
    setOrderCustomerPhone("");
    setOrderProductId("");
    setOrderQuantity("1");
    setOrderAmount("");
    setOrderPaidAmount("");
    setOrderAddress("");
    setOrderPaymentStatus("pending");
    setOrderDeliveryStatus("not_dispatched");
    setShowOrderForm(false);
  }

  async function deleteOrder(orderId: string) {
    if (!window.confirm("Are you sure you want to delete this order? Inventory counts will be restored automatically.")) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      const { data: membership } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.business_id) throw new Error("Business could not be found.");

      const { error } = await supabase.rpc("delete_order_with_inventory", {
        p_business_id: membership.business_id,
        p_order_id: orderId,
      });

      if (error) throw new Error(error.message);

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);

      await Promise.all([loadOrders(), loadPayments(), loadProducts()]);
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : "Failed to delete order."
      );
    }
  }

  async function savePayment() {
    if (!paymentOrderId) {
      setGlobalError("Please select an order.");
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setGlobalError("Please enter a valid payment amount.");
      return;
    }
    const order = orders.find((item) => item.id === paymentOrderId);
    if (!order) {
      setGlobalError("Order could not be found.");
      return;
    }

    setSavingPayment(true);
    try {
      const { error } = await supabase.rpc("record_order_payment", {
        p_business_id: order.business_id,
        p_order_id: order.id,
        p_amount: amount,
        p_method: paymentMethod,
      });

      if (error) throw new Error(error.message);

      await Promise.all([loadOrders(), loadPayments()]);
      setPaymentAmount("");
      setPaymentOrderId("");
      setPaymentMethod("other");
      setShowPaymentForm(false);
    } catch (error: unknown) {
      setGlobalError(
        error instanceof Error ? error.message : "Failed to record payment."
      );
    } finally {
      setSavingPayment(false);
    }
  }

  async function saveBusinessSettings() {
    if (!businessName.trim()) {
      setGlobalError("Business name is required.");
      return;
    }
    setSavingBusiness(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const { data: membership } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membership?.business_id) throw new Error("Business could not be found.");

      const { error } = await supabase
        .from("businesses")
        .update({
          name: businessName.trim(),
          phone: businessPhone.trim() || null,
          currency: businessCurrency,
          low_stock_threshold: lowStockThreshold,
        })
        .eq("id", membership.business_id);

      if (error) throw new Error(error.message);
      setBusinessName(businessName.trim());
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Could not save business settings."
      );
    } finally {
      setSavingBusiness(false);
    }
  }

  useEffect(() => {
    async function loadBusiness() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingBusiness(false);
        return;
      }

      const { data: membership } = await supabase
        .from("business_members")
        .select(
          "business_id, businesses(name, phone, currency, low_stock_threshold)"
        )
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.businesses) {
        const business = Array.isArray(membership.businesses)
          ? membership.businesses[0]
          : membership.businesses;
        if (business) {
          if (membership.business_id) setBusinessId(membership.business_id);
          setBusinessName(business.name || "Riri Collection");
          setBusinessPhone(business.phone || "");
      // @ts-ignore - paystack keys may not be in old schema
      setPaystackPublicKey((business as any).paystack_public_key || "");
      // @ts-ignore
      setPaystackSecretKey((business as any).paystack_secret_key || "");
          setBusinessCurrency(business.currency || "NGN");
          setLowStockThreshold(
            business.low_stock_threshold != null
              ? Number(business.low_stock_threshold)
              : 5
          );
        }
        setLoadingBusiness(false);
        return;
      }

      const { data: businessId, error: businessError } = await supabase.rpc(
        "create_my_business",
        { business_name: "Riri Collection" }
      );

      if (businessError || !businessId) {
        console.error("Business creation error:", businessError);
      } else {
        setBusinessId(businessId as string);
      }
      setBusinessName("Riri Collection");
      setLoadingBusiness(false);
    }

    loadBusiness();
  }, []); // FIXED: supabase is memoized

  useEffect(() => {
    if (active === "Dashboard" || active === "Orders" || active === "Payments") {
      loadOrders();
    }
    if (active === "Customers" || active === "Dashboard") {
      loadCustomers();
    }
    if (active === "Payments") {
      loadPayments();
    }
    if (active === "Products" || active === "Dashboard") {
      loadProducts();
    }
    if (active === "Deliveries") {
      loadDeliveries();
    }
  }, [active]);

  // Derived Filters
  const filteredOrders = orders.filter((order) => {
    const customer = normalizeCustomer(order.customers);
    const search = orderSearch.toLowerCase().trim();

    const matchesSearch =
      !search ||
      order.order_number?.toLowerCase().includes(search) ||
      customer?.name?.toLowerCase().includes(search) ||
      customer?.phone?.toLowerCase().includes(search);

    const matchesPayment =
      orderPaymentFilter === "all" ||
      order.payment_status === orderPaymentFilter;

    const matchesDelivery =
      orderDeliveryFilter === "all" ||
      order.delivery_status === orderDeliveryFilter;

    return matchesSearch && matchesPayment && matchesDelivery;
  });

  const filteredDeliveries = deliveries.filter((delivery) => {
    const customer = normalizeCustomer(delivery.customers);
    const search = deliverySearch.toLowerCase().trim();

    const matchesSearch =
      !search ||
      delivery.order_number?.toLowerCase().includes(search) ||
      customer?.name?.toLowerCase().includes(search) ||
      customer?.phone?.toLowerCase().includes(search) ||
      delivery.delivery_address?.toLowerCase().includes(search);

    const matchesStatus =
      deliveryStatusFilter === "all" ||
      delivery.delivery_status === deliveryStatusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loadingBusiness) {
    return <LoadingScreen message="Setting up your Orderly workspace..." />;
  }

  return (
    <main className="min-h-screen bg-[#FAF7F1] text-gray-900 selection:bg-[#6B21A8] selection:text-white">
      {/* Global Error Notice Banner */}
      {globalError && (
        <div className="fixed top-4 right-4 z-50 flex max-w-md items-center justify-between gap-3 rounded-2xl bg-red-600 px-4 py-3 text-white shadow-xl animate-bounce">
          <span className="text-sm font-medium">{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="rounded-lg bg-red-700 px-2 py-1 text-xs font-bold hover:bg-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Restock Modal Prompt Dialog */}
      {showRestockModal && restockTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Restock Product</h3>
            <p className="mt-1 text-sm text-gray-500">
              Adding stock for <span className="font-semibold text-gray-900">{restockTargetProduct.name}</span>. Current stock: {restockTargetProduct.stock_quantity}.
            </p>
            <div className="mt-4">
              <input
                type="number"
                min="1"
                placeholder="Quantity to add *"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={closeRestockModal}
                disabled={restockingProduct}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRestock}
                disabled={restockingProduct}
                className="flex-1 rounded-xl bg-[#6B21A8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#171643] disabled:opacity-50"
              >
                {restockingProduct ? "Updating..." : "Confirm Restock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Inventory History Modal */}
      {showProductHistory && historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold">Inventory History</h3>
                <p className="text-xs text-gray-500">{historyProduct.name} (SKU: {historyProduct.sku || "N/A"})</p>
              </div>
              <button
                onClick={() => setShowProductHistory(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold hover:bg-gray-200"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {loadingProductHistory ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading history logs...</div>
              ) : selectedProductHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
                  <p className="text-sm font-semibold text-gray-500">No stock movements recorded yet</p>
                </div>
              ) : (
                selectedProductHistory.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                    <div>
                      <p className="font-semibold capitalize text-gray-900">{m.movement_type.replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${Number(m.quantity) > 0 ? "text-green-600" : "text-red-600"}`}>
                        {Number(m.quantity) > 0 ? `+${m.quantity}` : m.quantity} units
                      </p>
                      <p className="text-xs text-gray-400">Balance: {m.stock_after}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
                <p className="text-xs text-gray-500">{selectedCustomer.phone} {selectedCustomer.email ? `• ${selectedCustomer.email}` : ""}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold hover:bg-gray-200"
              >
                ✕ Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Order History</h4>
              {loadingCustomerOrders ? (
                <div className="py-6 text-center text-sm text-gray-500">Loading orders...</div>
              ) : customerOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  This customer has not placed any orders yet.
                </div>
              ) : (
                customerOrders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
                    <div>
                      <p className="font-semibold">{ord.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(ord.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(Number(ord.total || 0), businessCurrency)}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ord.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {ord.payment_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white px-5 py-6 md:flex">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B21A8] text-lg font-bold text-white shadow-md">
                R
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">
                  RIRI
                </h1>
                <p className="text-xs font-medium text-gray-400">Business Manager</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Workspace
            </p>
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => setActive(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active === item.name
                    ? "bg-[#6B21A8] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-base">
                  {item.icon}
                </span>
                {item.name}
              </button>
            ))}
          </nav>
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">YOUR BUSINESS</p>
            <p className="mt-1 font-bold text-gray-900 truncate">{businessName}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Currency: {businessCurrency} ({getCurrencySymbol(businessCurrency)})
            </p>
            
            {/* SHOP LINK - CLICKABLE */}
            <div className="mt-3 space-y-2">
              <a
                href={businessId ? `/shop/${businessId}` : `https://riri-collection-plum.vercel.app/shop/09689ea5-f703-41bf-b7e2-b1c6a601258f`}
                target="_blank"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B21A8] px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4a1575] transition"
              >
                🛒 View My Shop
              </a>
              <a
                href="/admin"
                target="_blank"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition"
              >
                📦 Pro Admin
              </a>
              <button
                onClick={() => {
                  const url = businessId ? `${window.location.origin}/shop/${businessId}` : 'https://riri-collection-plum.vercel.app/shop/09689ea5-f703-41bf-b7e2-b1c6a601258f';
                  navigator.clipboard.writeText(url);
                  alert('Shop link copied! ' + url);
                }}
                className="w-full text-[10px] text-gray-400 hover:text-[#6B21A8] transition"
              >
                Copy shop link
              </button>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
          >
            <span className="flex h-5 w-5 items-center justify-center text-base">
              ⏻
            </span>
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Welcome back 👋</p>
              <h2 className="text-lg font-bold sm:text-xl text-gray-900">{active}</h2>
              {/* MOBILE: View My Shop - VISIBLE ON PHONE */}
              <div className="md:hidden mt-2 flex gap-2">
                <a
                  href={businessId ? `/shop/${businessId}` : `https://riri-collection-plum.vercel.app/shop/09689ea5-f703-41bf-b7e2-b1c6a601258f`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full bg-[#6B21A8] px-3 py-1 text-[11px] font-bold text-white"
                >
                  🛒 View My Shop
                </a>
                <a
                  href="/admin"
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[11px] font-bold text-white"
                >
                  📦 Pro Admin
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setActive("Orders");
                  setShowOrderForm(true);
                }}
                className="hidden rounded-xl bg-[#6B21A8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#171643] sm:block"
              >
                + New Order
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6B21A8] text-xs font-bold text-white shadow-inner">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 md:hidden"
                aria-label="Sign out"
              >
                ⏻
              </button>
            </div>
          </header>

          {/* Mobile Navigation Bar */}
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 md:hidden scrollbar-none">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => setActive(item.name)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  active === item.name
                    ? "bg-[#6B21A8] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* --- DASHBOARD VIEW --- */}
          {active === "Dashboard" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Today's Sales"
                  value={formatCurrency(todaySales, businessCurrency)}
                  change={`${salesChange >= 0 ? "+" : ""}${salesChange.toFixed(
                    0
                  )}%`}
                  description="vs yesterday"
                />
                <StatCard
                  title="Total Orders"
                  value={orders.length.toString()}
                  description="all time orders"
                />
                <StatCard
                  title="Total Customers"
                  value={customers.length.toString()}
                  description="registered client base"
                />
                <StatCard
                  title="Low Stock Items"
                  value={lowStockProducts.toString()}
                  description="requires attention"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base">Recent Orders</h3>
                    <button
                      onClick={() => setActive("Orders")}
                      className="text-xs font-semibold text-[#6B21A8] hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">No orders recorded yet.</div>
                  ) : (
                    orders.slice(0, 5).map((order) => {
                      const customer = normalizeCustomer(order.customers);
                      return (
                        <div
                          key={order.id}
                          onClick={() => {
                            setSelectedOrder(order);
                            setActive("Orders");
                          }}
                          className="flex cursor-pointer items-center justify-between border-b border-gray-100 py-3 last:border-0 hover:bg-gray-50"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                              {order.order_number}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {customer?.name || "Customer"}
                            </p>
                          </div>
                          <p className="font-bold text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                            {formatCurrency(Number(order.total || 0), businessCurrency)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-sm sm:text-base">Stock Alerts</h3>
                    <button
                      onClick={() => setActive("Products")}
                      className="text-xs font-semibold text-[#6B21A8] hover:underline"
                    >
                      View Inventory
                    </button>
                  </div>
                  {lowStockProductList.concat(outOfStockProductList).length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">All products are well stocked! 🎉</div>
                  ) : (
                    lowStockProductList.concat(outOfStockProductList).slice(0, 5).map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{prod.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            SKU: {prod.sku || "N/A"}
                          </p>
                        </div>
                        <StockBadge
                          quantity={Number(prod.stock_quantity ?? 0)}
                          threshold={Number(prod.low_stock_threshold ?? 5)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- ORDERS VIEW --- */}
          {active === "Orders" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight md:text-3xl text-gray-900">
                    Orders
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create and manage customer orders smoothly.
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#171643]"
                >
                  + Create Order
                </button>
              </div>

              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by order number, customer name or phone..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#6B21A8] sm:w-1/2"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select
                    value={orderDeliveryFilter}
                    onChange={(e) => setOrderDeliveryFilter(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#6B21A8] sm:w-1/2"
                  >
                    <option value="all">All Deliveries</option>
                    <option value="not_dispatched">Not Dispatched</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {showOrderForm && (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <h4 className="text-lg font-bold">
                    {editingOrderId ? "Edit Order" : "Create Order"}
                  </h4>
                  <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2">
                    <input
                      value={orderCustomerName}
                      onChange={(e) => setOrderCustomerName(e.target.value)}
                      placeholder="Customer name *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      value={orderCustomerPhone}
                      onChange={(e) => setOrderCustomerPhone(e.target.value)}
                      placeholder="Customer phone *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <select
                      value={orderProductId}
                      onChange={(e) => {
                        const productId = e.target.value;
                        setOrderProductId(productId);
                        const selectedProduct = products.find(
                          (product) => product.id === productId
                        );
                        if (selectedProduct) {
                          const quantity = Number(orderQuantity || 1);
                          setOrderAmount(
                            String(Number(selectedProduct.price) * quantity)
                          );
                        } else {
                          setOrderAmount("");
                        }
                      }}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    >
                      <option value="">Select product *</option>
                      {products
                        .filter((product) => product.active)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} — {formatCurrency(Number(product.price), businessCurrency)}
                          </option>
                        ))}
                    </select>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={orderQuantity}
                        onChange={(e) => {
                          const quantity = e.target.value;
                          setOrderQuantity(quantity);
                          const selectedProduct = products.find(
                            (product) => product.id === orderProductId
                          );
                          if (selectedProduct) {
                            setOrderAmount(
                              String(
                                Number(selectedProduct.price) *
                                  Number(quantity || 1)
                              )
                            );
                          }
                        }}
                        placeholder="Quantity"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                      />
                    </div>
                    <input
                      type="number"
                      value={orderAmount}
                      readOnly
                      placeholder="Order amount *"
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="number"
                      value={orderPaidAmount}
                      onChange={(e) => setOrderPaidAmount(e.target.value)}
                      placeholder={`Paid amount (${getCurrencySymbol(businessCurrency)})`}

                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      placeholder="Delivery address"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8] md:col-span-2"
                    />
                    <select
                      value={orderPaymentStatus}
                      onChange={(e) => setOrderPaymentStatus(e.target.value)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    >
                      <option value="pending">Payment Pending</option>
                      <option value="paid">Paid</option>
                      <option value="partially_paid">Partially Paid</option>
                    </select>
                    <select
                      value={orderDeliveryStatus}
                      onChange={(e) => setOrderDeliveryStatus(e.target.value)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    >
                      <option value="not_dispatched">Not Dispatched</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={cancelOrderForm}
                      className="w-full sm:w-auto rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveOrder}
                      disabled={savingOrder}
                      className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#171643]"
                    >
                      {savingOrder
                        ? "Saving..."
                        : editingOrderId
                        ? "Update Order"
                        : "Save Order"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {loadingOrders ? (
                  <div className="p-12 text-center text-sm text-gray-500">
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-base font-semibold text-gray-600">No orders match your search</p>
                    <p className="mt-1 text-xs text-gray-400">Try adjusting your search criteria or create a new order.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const customer = normalizeCustomer(order.customers);
                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="flex cursor-pointer flex-col gap-3 p-4 sm:p-6 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-bold text-gray-900">{order.order_number}</p>
                            <p className="text-sm font-medium text-gray-700">
                              {customer?.name || "Unknown customer"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {customer?.phone || "No phone"}
                            </p>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>
                                <span className="text-gray-500">Product:</span>{" "}
                                <span className="font-medium text-gray-800">
                                  {order.order_items?.[0]?.product_name ||
                                    "No product"}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-500">Total:</span>{" "}
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(Number(order.total || 0), businessCurrency)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <select
                              value={order.status || "new"}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none focus:border-[#6B21A8] ${
                                order.status === "confirmed"
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : order.status === "processing"
                                  ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                  : order.status === "completed"
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : order.status === "cancelled"
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <span
                              className={`rounded-full px-3 py-1 font-semibold ${
                                order.payment_status === "paid"
                                  ? "bg-green-50 text-green-700"
                                  : order.payment_status === "partially_paid"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              Payment: {order.payment_status.replace("_", " ")}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sendWhatsAppReceipt(order);
                              }}
                              className="rounded-full bg-green-600 px-3 py-1 font-bold text-white hover:bg-green-700"
                              title="Send WhatsApp Receipt"
                            >
                              🟢 WhatsApp
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePaystackLink(order);
                              }}
                              disabled={generatingPaystack === order.id}
                              className="rounded-full bg-[#6B21A8] px-3 py-1 font-bold text-white hover:bg-[#4a1575] disabled:opacity-50"
                              title="Generate Paystack Pay Link"
                            >
                              {generatingPaystack === order.id ? "..." : "💜 Pay Link"}
                            </button>
                            {paystackLinks[order.id] && (
                              <a
                                href={paystackLinks[order.id]}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-full bg-black px-3 py-1 font-bold text-white hover:bg-gray-800"
                              >
                                Open Pay
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditOrder(order);
                              }}
                              className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteOrder(order.id);
                              }}
                              disabled={deletingOrderId === order.id}
                              className="rounded-full border border-red-200 px-3 py-1 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingOrderId === order.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- CUSTOMERS VIEW --- */}
          {active === "Customers" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight md:text-3xl text-gray-900">
                    Customers
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your client directory and track past activities.
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomerForm(true)}
                  className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#171643]"
                >
                  + Add Customer
                </button>
              </div>

              {showCustomerForm && (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <h4 className="text-lg font-bold">
                    {editingCustomerId ? "Edit Customer" : "Add Customer"}
                  </h4>
                  <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2">
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Note (optional)"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8] md:col-span-2"
                      rows={3}
                    />
                  </div>
                  <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={cancelCustomerForm}
                      className="w-full sm:w-auto rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCustomer}
                      disabled={savingCustomer}
                      className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#171643]"
                    >
                      {savingCustomer
                        ? "Saving..."
                        : editingCustomerId
                        ? "Update Customer"
                        : "Save Customer"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {loadingCustomers ? (
                  <div className="p-12 text-center text-sm text-gray-500">
                    Loading customers...
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-base font-semibold text-gray-600">No customers yet</p>
                    <p className="mt-1 text-xs text-gray-400">Add your first customer to start building your database.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            loadCustomerHistory(customer.id);
                          }}
                          className="p-4 space-y-2 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-gray-900">{customer.name}</span>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => startEditCustomer(customer)}
                                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCustomer(customer.id)}
                                disabled={deletingCustomerId === customer.id}
                                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">📞 {customer.phone}</p>
                          {customer.email && <p className="text-xs text-gray-500">✉️ {customer.email}</p>}
                          {customer.address && <p className="text-xs text-gray-500">📍 {customer.address}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Customer
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Phone
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Email
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Address
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((customer) => (
                            <tr
                              key={customer.id}
                              onClick={() => {
                                setSelectedCustomer(customer);
                                loadCustomerHistory(customer.id);
                              }}
                              className="cursor-pointer border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {customer.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {customer.phone}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {customer.email || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {customer.address || "—"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditCustomer(customer);
                                    }}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCustomer(customer.id);
                                    }}
                                    disabled={deletingCustomerId === customer.id}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    {deletingCustomerId === customer.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- PRODUCTS VIEW --- */}
          {active === "Products" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight md:text-3xl text-gray-900">
                    Products
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage inventory catalogue and active stock levels.
                  </p>
                </div>
                <button
                  onClick={() => setShowProductForm(true)}
                  className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#171643]"
                >
                  + Add Product
                </button>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Products"
                  value={totalProducts.toString()}
                  description="catalogue size"
                />
                <StatCard
                  title="Stock Units"
                  value={totalStockUnits.toString()}
                  description="total items available"
                />
                <StatCard
                  title="Low Stock"
                  value={lowStockProducts.toString()}
                  description="needs restocking"
                />
                <StatCard
                  title="Out of Stock"
                  value={outOfStockProducts.toString()}
                  description="unavailable"
                />
              </div>

              {showProductForm && (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <h4 className="text-lg font-bold">
                    {editingProductId ? "Edit Product" : "Add Product"}
                  </h4>
                  <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2">
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Product name *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      value={productSku}
                      onChange={(e) => setProductSku(e.target.value)}
                      placeholder="SKU"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Selling price *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      type="number"
                      value={productCostPrice}
                      onChange={(e) => setProductCostPrice(e.target.value)}
                      placeholder="Cost price"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      type="number"
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      placeholder="Stock quantity"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      placeholder="Low stock threshold"
                      min="0"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />
                  </div>
                  <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={cancelProductForm}
                      className="w-full sm:w-auto rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProduct}
                      disabled={savingProduct}
                      className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#171643]"
                    >
                      {savingProduct
                        ? "Saving..."
                        : editingProductId
                        ? "Update Product"
                        : "Save Product"}
                    </button>
                  </div>
                </div>
              )}

              {/* Stock Alerts Grid */}
              <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900">Low Stock Alerts</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Products nearing depletion.
                  </p>
                  <div className="mt-4 space-y-3">
                    {lowStockProductList.length === 0 ? (
                      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 text-center">
                        No low-stock products right now.
                      </p>
                    ) : (
                      lowStockProductList.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {product.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                              {product.stock_quantity} units remaining
                            </p>
                          </div>
                          <button
                            onClick={() => openRestockModal(product)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 whitespace-nowrap shadow-sm"
                          >
                            Restock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900">Out of Stock Alerts</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Products currently unavailable for customers.
                  </p>
                  <div className="mt-4 space-y-3">
                    {outOfStockProductList.length === 0 ? (
                      <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 text-center">
                        No products are out of stock.
                      </p>
                    ) : (
                      outOfStockProductList.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {product.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-600 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                              Out of stock
                            </p>
                          </div>
                          <button
                            onClick={() => openRestockModal(product)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 whitespace-nowrap shadow-sm"
                          >
                            Restock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {loadingProducts ? (
                  <div className="p-12 text-center text-sm text-gray-500">
                    Loading products catalogue...
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-base font-semibold text-gray-600">No products yet</p>
                    <p className="mt-1 text-xs text-gray-400">Add your first product to start building your catalogue.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {products.map((product) => (
                        <div key={product.id} className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-400">SKU: {product.sku || "—"}</p>
                            </div>
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold">
                              {product.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-900">{formatCurrency(Number(product.price || 0), businessCurrency)}</span>
                            <div className="flex items-center gap-1.5">
                              <StockBadge
                                quantity={Number(product.stock_quantity ?? 0)}
                                threshold={Number(product.low_stock_threshold ?? 5)}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              onClick={() => startEditProduct(product)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => loadProductHistory(product)}
                              disabled={loadingProductHistory}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                              History
                            </button>
                            <button
                              onClick={() => openRestockModal(product)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              disabled={deletingProductId === product.id}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Product
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              SKU
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Price
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Stock
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Status
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr
                              key={product.id}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                            >
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {product.sku || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                {formatCurrency(Number(product.price || 0), businessCurrency)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <StockBadge
                                    quantity={Number(product.stock_quantity ?? 0)}
                                    threshold={Number(
                                      product.low_stock_threshold ?? 5
                                    )}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                  {product.active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditProduct(product)}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => loadProductHistory(product)}
                                    disabled={loadingProductHistory}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    History
                                  </button>
                                  <button
                                    onClick={() => openRestockModal(product)}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                                  >
                                    Restock
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(product.id)}
                                    disabled={deletingProductId === product.id}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    {deletingProductId === product.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- PAYMENTS VIEW --- */}
          {active === "Payments" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight md:text-3xl text-gray-900">
                    Payments
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Track money collected across customer orders.
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#171643]"
                >
                  + Record Payment
                </button>
              </div>

              {showPaymentForm && (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <h4 className="text-lg font-bold">Record Payment</h4>
                  <div className="mt-5 grid gap-4 grid-cols-1 md:grid-cols-2">
                    <select
                      value={paymentOrderId}
                      onChange={(e) => setPaymentOrderId(e.target.value)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    >
                      <option value="">Select Order *</option>
                      {orders
                        .filter(
                          (o) =>
                            Number(o.total || 0) - Number(o.paid_amount || 0) > 0
                        )
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.order_number} (Outstanding:{" "}
                            {formatCurrency(
                              Number(o.total || 0, businessCurrency) - Number(o.paid_amount || 0)
                            )}
                            )
                          </option>
                        ))}
                    </select>

                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Payment Amount *"
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    />

                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="card">POS / Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className="w-full sm:w-auto rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePayment}
                      disabled={savingPayment}
                      className="w-full sm:w-auto rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#171643]"
                    >
                      {savingPayment ? "Saving..." : "Save Payment"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {loadingPayments ? (
                  <div className="p-12 text-center text-sm text-gray-500">
                    Loading payments history...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-base font-semibold text-gray-600">No payment logs found</p>
                    <p className="mt-1 text-xs text-gray-400">Record your first incoming payment above.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 md:hidden">
                      {payments.map((p) => (
                        <div key={p.id} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{p.orders?.order_number || "—"}</p>
                            <p className="text-xs text-gray-500 capitalize">{p.method?.replace("_", " ") || "Other"}</p>
                            <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                          <p className="text-sm font-bold text-green-600">
                            {formatCurrency(Number(p.amount || 0), businessCurrency)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Order Ref
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Method
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr
                              key={p.id}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                            >
                              <td className="px-6 py-4 font-semibold text-sm text-gray-900">
                                {p.orders?.order_number || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-green-600">
                                {formatCurrency(Number(p.amount || 0), businessCurrency)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                {p.method?.replace("_", " ") || "Other"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(p.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- DELIVERIES VIEW --- */}
          {active === "Deliveries" && (
            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl text-gray-900">
                  Deliveries
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Track orders pending fulfillment or in transit.
                </p>
                <div className="mb-6 mt-6 flex flex-col gap-3 md:flex-row">
                  <input
                    type="text"
                    placeholder="Search customer, phone, order..."
                    value={deliverySearch}
                    onChange={(e) => setDeliverySearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#6B21A8] md:flex-1"
                  />
                  <select
                    value={deliveryStatusFilter}
                    onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                    className="w-full md:w-auto rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#6B21A8]"
                  >
                    <option value="all">All Delivery Statuses</option>
                    <option value="not_dispatched">Not Dispatched</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Not Dispatched"
                    value={deliveries
                      .filter(
                        (delivery) =>
                          delivery.delivery_status === "not_dispatched"
                      )
                      .length.toString()}
                    description="to ship"
                  />
                  <StatCard
                    title="Dispatched"
                    value={deliveries
                      .filter(
                        (delivery) =>
                          delivery.delivery_status === "dispatched"
                      )
                      .length.toString()}
                    description="in transit"
                  />
                  <StatCard
                    title="Delivered"
                    value={deliveries
                      .filter(
                        (delivery) => delivery.delivery_status === "delivered"
                      )
                      .length.toString()}
                    description="completed fulfillment"
                  />
                  <StatCard
                    title="Failed"
                    value={deliveries
                      .filter(
                        (delivery) => delivery.delivery_status === "failed"
                      )
                      .length.toString()}
                    description="needs attention"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {loadingDeliveries ? (
                  <div className="p-12 text-center text-sm text-gray-500">
                    Loading deliveries status...
                  </div>
                ) : filteredDeliveries.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-base font-semibold text-gray-600">No deliveries found</p>
                    <p className="mt-1 text-xs text-gray-400">Delivery records update automatically with orders.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredDeliveries.map((delivery) => {
                      const customer = normalizeCustomer(delivery.customers);
                      return (
                        <div key={delivery.id} className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-900">{delivery.order_number}</p>
                            <p className="text-sm font-medium text-gray-700">{customer?.name || "Customer"} ({customer?.phone || "No phone"})</p>
                            <p className="text-xs text-gray-500 mt-1">📍 {delivery.delivery_address || "No delivery address specified"}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={delivery.delivery_status || "not_dispatched"}
                              onChange={(e) => updateDeliveryStatus(delivery.id, e.target.value)}
                              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#6B21A8]"
                            >
                              <option value="not_dispatched">Not Dispatched</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="delivered">Delivered</option>
                              <option value="failed">Failed</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- SETTINGS VIEW --- */}
          {active === "Settings" && (
            <div className="p-4 sm:p-6 md:p-8 max-w-3xl space-y-6">
              <div>
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl text-gray-900">Business Settings</h3>
                <p className="mt-1 text-sm text-gray-500">Update your brand and manage team access.</p>
              </div>

              <div className="rounded-2xl border-2 border-[#6B21A8]/20 bg-white p-6 shadow-sm">
                <h4 className="text-base font-bold text-gray-900">👥 Team Login (Safe - Won't Break)</h4>
                <p className="mt-1 text-xs text-gray-500">Step 1: Staff creates account at /login - Create Account. Step 2: You add their email here.</p>
                <div className="mt-4 flex gap-2">
                  <input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="staff email e.g. ada@gmail.com" className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
                  <button onClick={addTeamMember} disabled={addingMember} className="rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-bold text-white hover:bg-[#4a1575] disabled:opacity-50">{addingMember ? "..." : "+ Add Staff"}</button>
                </div>
                {loadingTeam ? <p className="mt-3 text-xs text-gray-400">Loading team...</p> : (
                  <div className="mt-3 space-y-1">
                    {teamMembers.map((m:any) => (
                      <div key={m.user_id} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs"><span>{m.user_id.slice(0,8)}... - {m.role}</span><span className="text-green-600">active</span></div>
                    ))}
                    {teamMembers.length===0 && <p className="text-xs text-gray-400">Only you - no staff yet.</p>}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Business Name</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Business Phone Number</label>
                  <input type="text" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="e.g. 08012345678" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Currency Symbol</label>
                  <select value={businessCurrency} onChange={(e) => setBusinessCurrency(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]">
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Paystack Public Key</label>
                  <input type="text" value={paystackPublicKey} onChange={(e) => setPaystackPublicKey(e.target.value)} placeholder="pk_live_xxx or pk_test_xxx" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Paystack Secret Key</label>
                  <input type="password" value={paystackSecretKey} onChange={(e) => setPaystackSecretKey(e.target.value)} placeholder="sk_live_xxx" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Default Low Stock Threshold</label>
                  <input type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#6B21A8]" />
                </div>
                <div className="pt-4">
                  <button onClick={saveBusinessSettings} disabled={savingBusiness} className="w-full rounded-xl bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#171643] disabled:opacity-50">
                    {savingBusiness ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    
      <button onClick={() => { setActive("Orders"); setShowOrderForm(true); }} className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#6B21A8] text-2xl font-bold text-white shadow-2xl md:hidden active:scale-95 transition">+</button>
      <style>{`.scrollbar-none::-webkit-scrollbar{display:none}.scrollbar-none{-ms-overflow-style:none;scrollbar-width:none}`}</style>
</main>
  );
}