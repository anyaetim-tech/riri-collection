"use client";
import { useState, useEffect } from 'react';
import { getOrders, saveOrders, Order } from '@/lib/store';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
export default function OrdersPage(){
  const params=useParams(); const slug=(params?.slug as string)||'jamoy';
  const [orders,setOrders]=useState<any[]>([]);
  const [lastCount,setLastCount]=useState(0);
  const [newAlert,setNewAlert]=useState<any>(null);
  useEffect(()=>{ const o=getOrders(slug); setOrders(o); setLastCount(o.length); },[slug]);
  useEffect(()=>{
    const id=setInterval(()=>{
      const latest=getOrders(slug);
      if(latest.length>lastCount){ setNewAlert(latest[latest.length-1]); setOrders(latest); setLastCount(latest.length); try{ new Audio('https://cdn.pixabay.com/audio/2022/03/24/audio_4d171711d7.mp3').play(); }catch{} }
      else if(latest.length!==orders.length || JSON.stringify(latest)!==JSON.stringify(orders)){ setOrders(latest); }
    },3000);
    return ()=>clearInterval(id);
  },[slug,lastCount,orders]);
  const updateStatus=(id:string, field:string, value:string)=>{
    const updated=orders.map(o=> o.id===id ? {...o, [field]:value, seenByOwner:true, seenByOwnerAt:new Date().toISOString()} : o);
    saveOrders(slug, updated); setOrders(updated);
  };
  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4'>
      <div className='max-w-[1000px] mx-auto'>
        <div className='flex items-center justify-between'><h1 className='font-bold'>Orders ({orders.length}) - SEEN TRACKING ON</h1><Link href={`/s/${slug}`} className='h-8 px-3 rounded-full bg-black text-white text-[11px]'>Shop</Link></div>
        {newAlert && <div className='mt-3 bg-green-500 text-white p-4 rounded-[16px]'><p className='font-bold'>🔔 NEW ORDER {newAlert.id}</p><button onClick={()=>setNewAlert(null)} className='mt-2 h-8 px-3 rounded-full bg-white text-black text-[11px]'>Dismiss</button></div>}
        <div className='mt-4 grid gap-3'>
          {orders.slice().reverse().map((o:any)=>(
            <Card key={o.id} className='p-4 rounded-[16px]'>
              <div className='flex justify-between'><p className='font-bold text-[13px]'>{o.id} - {o.customer?.name} - ₦{o.total?.toLocaleString()}</p><p className='text-[11px]'>{o.status}</p></div>
              <p className='text-[11px] text-gray-500'>{o.customer?.phone} - {o.customer?.address}</p>
              <div className='mt-2 flex flex-wrap gap-2 text-[10px]'>
                <span className={`px-2 py-1 rounded-full font-bold ${o.seenByOwner?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{o.seenByOwner?`✓ You seen at ${o.seenByOwnerAt?new Date(o.seenByOwnerAt).toLocaleTimeString():''}`:'⏳ You not seen yet (Pending)'}</span>
                <span className={`px-2 py-1 rounded-full font-bold ${o.viewedByCustomer?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`}>{o.viewedByCustomer?`✓ Customer seen track ${o.viewCount?`(${o.viewCount}x)`:''} at ${o.viewedByCustomerAt?new Date(o.viewedByCustomerAt).toLocaleTimeString():''}`:'👁 Customer not tracked yet'}</span>
              </div>
              <div className='mt-3 flex gap-2'>
                <select value={o.status} onChange={e=>updateStatus(o.id,'status',e.target.value)} className='h-8 rounded-full border text-[11px] px-2'><option>Pending</option><option>Confirmed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select>
                <a href={`https://wa.me/${o.customer?.phone?.replace(/\D/g,'')}?text=Hi%20${o.customer?.name}%20I%20have%20seen%20your%20order%20${o.id}%20-%20${o.status}.%20Track%20at%20/track`} target='_blank' className='h-8 px-3 rounded-full bg-[#25D366] text-white text-[11px] font-bold flex items-center'>WhatsApp Customer - Mark Seen</a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
