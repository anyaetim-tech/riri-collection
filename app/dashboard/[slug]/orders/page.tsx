"use client";
import { useState, useEffect } from 'react';
import { getOrders, saveOrders, Order } from '@/lib/store';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
export default function OrdersPage(){
  const params=useParams(); const slug=(params?.slug as string)||'jamoy';
  const [orders,setOrders]=useState<Order[]>([]); const [newAlert,setNewAlert]=useState<Order|null>(null); const [lastCount,setLastCount]=useState(0);
  useEffect(()=>{ const o=getOrders(slug); setOrders(o); setLastCount(o.length); },[slug]);
  useEffect(()=>{
    const id=setInterval(()=>{ const latest=getOrders(slug); if(latest.length>lastCount){ setNewAlert(latest[latest.length-1] as any); setOrders(latest); setLastCount(latest.length); try{ new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_4d171711d7.mp3').play(); }catch{} if(navigator.vibrate) navigator.vibrate([200,100,200]); } },3000);
    return ()=>clearInterval(id);
  },[slug,lastCount]);
  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4'>
      <h1 className='font-bold'>Orders ({orders.length}) - Auto refresh + Sound + Vibrate</h1>
      {newAlert && <div className='mt-3 bg-green-500 text-white p-4 rounded-[16px]'><p className='font-bold'>🔔 NEW ORDER {(newAlert as any).id} - {(newAlert as any).customer?.name} ₦{(newAlert as any).total?.toLocaleString()}</p><button onClick={()=>setNewAlert(null)} className='mt-2 h-8 px-3 rounded-full bg-white text-black text-[11px]'>Dismiss</button></div>}
      <div className='mt-4 grid gap-3'>{orders.slice().reverse().map((o:any)=>(<Card key={o.id} className='p-4'><p className='font-bold text-[13px]'>{o.id} - {o.customer?.name} - ₦{o.total?.toLocaleString()}</p><p className='text-[11px] text-gray-500'>{o.customer?.phone} {o.customer?.address}</p><p className='text-[10px]'>{new Date(o.date).toLocaleString()}</p></Card>))}</div>
      {orders.length===0 && <Card className='mt-6 p-8 text-center border-dashed'><p>No orders yet. When someone orders from /s/{slug}, you get WhatsApp + sound alert here.</p></Card>}
    </div>
  );
}
