"use client";
import { useState, useEffect } from 'react';
import { getOrders, saveOrders } from '@/lib/store';
import Link from 'next/link';
export default function TrackPage(){
  const [orderId,setOrderId]=useState('');
  const [order,setOrder]=useState<any>(null);
  const [notFound,setNotFound]=useState(false);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const o=params.get('order'); if(o){ setOrderId(o); search(o); }
  },[]);
  const search=(idParam?:string)=>{
    const id=(idParam||orderId).trim();
    if(!id) return;
    const slugs=['jomal','jamoy','demo'];
    let found=null; let foundSlug='';
    for(const slug of slugs){
      const orders=getOrders(slug);
      const f=orders.find((o:any)=>o.id.toLowerCase()===id.toLowerCase()||o.id.includes(id));
      if(f){ found=f; foundSlug=slug; break; }
    }
    if(found){
      if(!found.viewedByCustomer){
        found={...found, viewedByCustomer:true, viewedByCustomerAt:new Date().toISOString()};
        const orders=getOrders(foundSlug);
        const updated=orders.map((o:any)=>o.id===found.id?found:o);
        saveOrders(foundSlug, updated);
      }
      setOrder(found); setNotFound(false);
    } else { setOrder(null); setNotFound(true); }
  };
  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4'>
      <div className='max-w-[600px] mx-auto'>
        <div className='flex gap-2 mb-4'><Link href='/' className='h-9 px-4 rounded-full bg-white border text-[12px] flex items-center'>Home</Link><Link href='/s/jomal' className='h-9 px-4 rounded-full bg-white border text-[12px] flex items-center'>Shop</Link></div>
        <h1 className='font-bold text-[20px]'>Track Order</h1>
        <div className='mt-4 flex gap-2'><input value={orderId} onChange={e=>setOrderId(e.target.value)} placeholder='ORD-...' className='flex-1 h-11 rounded-full border px-4 text-[12px]'/><button onClick={()=>search()} className='h-11 px-6 rounded-full bg-black text-white text-[12px] font-bold'>Track</button></div>
        {notFound && <p className='mt-4 text-red-500 text-[12px]'>Order not found</p>}
        {order && (<div className='mt-6 bg-white rounded-[20px] border p-5'><p className='font-bold'>{order.id}</p><p className='text-[12px]'>Status: {order.status}</p><div className='mt-3 p-3 bg-green-50 rounded-[12px] text-[11px]'><p className='font-bold text-green-700'>Owner notified you checked</p></div></div>)}
      </div>
    </div>
  );
}
