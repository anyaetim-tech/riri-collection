"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getProducts, getOrders, getShop } from "@/lib/store";
import Link from "next/link";
export default function DashboardPage(){
  const params=useParams();
  const slug=(params?.slug as string)||"jomal";
  const [products,setProducts]=useState<any[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ setMounted(true); setProducts(getProducts(slug)); setOrders(getOrders(slug)); },[slug]);
  if(!mounted) return <div>Loading...</div>;
  return (<div className="min-h-screen bg-[#FAF9F7] p-4"><div className="max-w-[1100px] mx-auto"><h1 className="font-bold text-[22px]">Dashboard {slug}</h1><div className="mt-4 grid grid-cols-2 gap-3"><div className="bg-white rounded-[16px] border p-4"><p>Products</p><p className="font-bold text-[20px]">{products.length}</p></div><div className="bg-white rounded-[16px] border p-4"><p>Orders</p><p className="font-bold text-[20px]">{orders.length}</p></div></div><div className="mt-6 grid gap-3"><Link href={`/dashboard/${slug}/products`} className="h-14 rounded-[16px] bg-black text-white flex items-center justify-center font-bold">Products</Link><Link href={`/dashboard/${slug}/orders`} className="h-14 rounded-[16px] bg-white border flex items-center justify-center font-bold">Orders</Link><Link href={`/s/${slug}`} className="h-14 rounded-[16px] bg-[#25D366] text-white flex items-center justify-center font-bold">View Shop</Link></div></div></div>);
}
