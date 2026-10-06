
"use client";
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getAllOrders, Order } from '@/lib/store';
import Link from 'next/link';
export default function TrackPage(){
  const [orderId,setOrderId]=useState('');
  const [result,setResult]=useState<Order|null>(null);
  const [allOrders,setAllOrders]=useState<Order[]>([]);
  const [err,setErr]=useState('');
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ setMounted(true); setAllOrders(getAllOrders()); },[]);
  const search=()=>{
    if(!orderId){ setErr('Enter Order ID'); return; }
    const found=allOrders.find(o=>o.id.toLowerCase()===orderId.toLowerCase());
    if(found){ setResult(found); setErr(''); } else { setErr(`Not found. Your orders: ${allOrders.map(o=>o.id).join(', ')||'none yet'}`); setResult(null); }
  };
  if(!mounted) return <div className='p-10 text-center'>Loading...</div>;
  return <div className='min-h-screen bg-[#FFFBF7]'><header className='h-[72px] flex items-center justify-between border-b bg-white px-6'><Link href='/' className='flex items-center gap-3'><img src='/logo.png' className='h-10 w-10 rounded-xl border'/><span className='font-bold'>Riri</span></Link><div className='flex gap-2'><Link href='/s/riri-collection' className='h-9 px-4 rounded-full border text-[12px] font-bold'>Shop</Link><Link href='/login' className='h-9 px-4 rounded-full bg-gray-900 text-white text-[12px] font-bold'>Login</Link></div></header><main className='max-w-2xl mx-auto p-6'><div className='text-center'><img src='/logo.png' className='h-16 w-16 mx-auto rounded-2xl border bg-white p-2'/><h1 className='mt-4 text-[28px] font-bold'>Track Order 📦</h1></div><Card className='mt-8 p-6'><Label>Order ID *</Label><Input value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder='ORD-...' className='font-mono font-bold mt-1'/>{err&&<p className='mt-3 text-[12px] text-red-600 bg-red-50 p-3 rounded-xl'>{err}</p>}<Button onClick={search} className='w-full mt-4 h-12 rounded-full bg-[#6B21A8]'>📦 Track</Button></Card>{result&&<Card className='mt-6 p-6 border-2 border-[#6B21A8]'><p className='font-bold'>Order {result.id} — {result.delivery}</p><p className='text-[13px] mt-1'>₦{result.total?.toLocaleString()} • {result.status} • {result.payment}</p></Card>}</main></div>
}
