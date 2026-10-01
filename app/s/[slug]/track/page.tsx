
"use client";
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getOrders, Order } from '@/lib/store';
import Link from 'next/link';
export default function ShopTrack({params}:{params:{slug:string}}){
  const slug=params?.slug||'riri-collection';
  const [orderId,setOrderId]=useState('');
  const [result,setResult]=useState<Order|null>(null);
  const [orders,setOrders]=useState<Order[]>([]);
  const [mounted,setMounted]=useState(false);
  const [err,setErr]=useState('');
  useEffect(()=>{ setMounted(true); setOrders(getOrders(slug)); },[slug]);
  const search=()=>{ const f=orders.find(o=>o.id.toLowerCase()===orderId.toLowerCase()); if(f){ setResult(f); setErr(''); } else { setErr(`Not found in /s/${slug}`); } };
  if(!mounted) return <div className='p-10'>Loading...</div>;
  return <div className='min-h-screen bg-[#FFFBF7] p-6'><Card className='p-6 max-w-xl mx-auto'><h1 className='font-bold'>Track /s/{slug} 📦</h1><Label className='mt-4 block'>Order ID</Label><Input value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder='ORD-...'/>{err&&<p className='text-red-600 text-[12px] mt-2'>{err}</p>}<Button onClick={search} className='w-full mt-4 h-12 rounded-full bg-[#6B21A8]'>Track</Button>{result&&<div className='mt-4 p-4 bg-[#FAF8F5] rounded-2xl'><p className='font-bold'>{result.id} — {result.delivery}</p><p>₦{result.total?.toLocaleString()}</p></div>}<div className='mt-4 flex gap-2'><Link href={`/s/${slug}`} className='text-[11px] border rounded-full px-3 py-1'>Shop</Link><Link href={`/dashboard/${slug}`} className='text-[11px] border rounded-full px-3 py-1'>Dashboard</Link></div></Card></div>
}
