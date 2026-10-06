"use client";
import { useState, useEffect } from 'react';
import { getOrders, saveOrders } from '@/lib/store';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function OrdersPage(){
  const params=useParams(); const slug=(params?.slug as string)||'jomal';
  const [orders,setOrders]=useState<any[]>([]);
  useEffect(()=>{
    let o=getOrders(slug);
    let changed=false;
    o=o.map((ord:any)=>{ if(!ord.viewedByOwner){ changed=true; return {...ord, viewedByOwner:true, viewedByOwnerAt:new Date().toISOString()}; } return ord; });
    if(changed) saveOrders(slug,o);
    setOrders(o);
    const id=setInterval(()=>setOrders(getOrders(slug)),3000);
    return ()=>clearInterval(id);
  },[slug]);
  const waCustomer=(ord:any)=>{
    const phone=(ord.customerPhone||'').replace(/[^0-9]/g,'');
    const msg=encodeURIComponent(`Hi ${ord.customerName}, I have seen your order ${ord.id}. Status: ${ord.status}. Track: /track?order=${ord.id}`);
    const link=phone?`https://wa.me/${phone}?text=${msg}`:`https://wa.me/?text=${msg}`;
    window.open(link,'_blank');
  };
  const updateStatus=(id:string,s:string)=>{ const updated=orders.map((o:any)=>o.id===id?{...o,status:s}:o); saveOrders(slug,updated); setOrders(updated); };
  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4'>
      <div className='max-w-[1100px] mx-auto'>
        <div className='flex gap-2 flex-wrap mb-4'>
          <Link href={`/dashboard/${slug}`} className='h-9 px-4 rounded-full bg-black text-white text-[12px] font-bold flex items-center'>← Back to Dashboard</Link>
          <Link href={`/s/${slug}`} className='h-9 px-4 rounded-full bg-white border text-[12px] font-bold flex items-center'>View Shop</Link>
          <Link href={`/dashboard/${slug}/products`} className='h-9 px-4 rounded-full bg-white border text-[12px] font-bold flex items-center'>Products</Link>
        </div>
        <h1 className='font-bold text-[18px]'>Orders {slug} ({orders.length}) - WhatsApp + Seen FIXED - Build OK</h1>
        <div className='mt-6 space-y-3'>
          {orders.map((ord:any)=>(
            <div key={ord.id} className='bg-white rounded-[16px] border p-4'>
              <p className='font-bold text-[13px]'>{ord.id} - {ord.customerName} - ₦{ord.total?.toLocaleString()}</p>
              <div className='mt-2 flex gap-2 flex-wrap text-[10px]'>
                {ord.viewedByOwner && <span className='px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-bold'>✓✓ You seen</span>}
                {ord.viewedByCustomer ? <span className='px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold'>✓✓ Customer seen at {ord.viewedByCustomerAt?new Date(ord.viewedByCustomerAt).toLocaleTimeString():''}</span> : <span className='px-2 py-1 rounded-full bg-gray-100'>○ Not yet seen</span>}
              </div>
              <div className='mt-3 flex gap-2'>
                <select value={ord.status} onChange={e=>updateStatus(ord.id,e.target.value)} className='h-8 rounded-full border text-[11px] px-2'><option>Pending</option><option>Confirmed</option><option>Shipped</option><option>Delivered</option></select>
                <button onClick={()=>waCustomer(ord)} className='h-8 px-3 rounded-full bg-[#25D366] text-white text-[11px] font-bold'>WhatsApp Customer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
