"use client";
import { useState } from 'react';
import { getOrders, saveOrders } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function TrackPage(){
  const [id,setId]=useState('');
  const [order,setOrder]=useState<any>(null);
  const [msg,setMsg]=useState('');

  const track=()=>{
    if(!id.trim()){ setMsg('Enter ORD ID'); return; }
    // search all shops orders - try jamoy first
    let found=null;
    const shops=['jamoy','riri','default'];
    // try localStorage all keys
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key && key.startsWith('riri_orders_')){
        try{
          const orders=JSON.parse(localStorage.getItem(key)||'[]');
          const f=orders.find((o:any)=>o.id===id.trim() || o.id.toLowerCase()===id.trim().toLowerCase());
          if(f){ found=f; break; }
        }catch{}
      }
    }
    if(!found){
      const all=JSON.parse(localStorage.getItem('riri_all_orders')||'[]');
      found=all.find((o:any)=>o.id===id.trim());
    }
    if(!found){
      setMsg('Order not found. Check ID: '+id);
      setOrder(null);
      return;
    }
    setOrder(found);
    setMsg('');

    // MARK AS SEEN BY CUSTOMER - so owner knows customer checked track
    try{
      const key=`riri_orders_${found.shopId}`;
      const orders=JSON.parse(localStorage.getItem(key)||'[]');
      const updated=orders.map((o:any)=>{
        if(o.id===found.id){
          return {...o, viewedByCustomer:true, viewedByCustomerAt:new Date().toISOString(), viewCount:(o.viewCount||0)+1};
        }
        return o;
      });
      localStorage.setItem(key, JSON.stringify(updated));
      // also update all
      const allKey='riri_all_orders';
      const allOrders=JSON.parse(localStorage.getItem(allKey)||'[]');
      const allUpdated=allOrders.map((o:any)=> o.id===found.id ? {...o, viewedByCustomer:true, viewedByCustomerAt:new Date().toISOString(), viewCount:(o.viewCount||0)+1} : o);
      localStorage.setItem(allKey, JSON.stringify(allUpdated));
    }catch(e){ console.log(e); }
  };

  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4 flex flex-col items-center'>
      <Link href='/' className='self-start h-9 px-4 rounded-full bg-white border text-[12px] font-bold flex items-center'>Home</Link>
      <div className='w-full max-w-md mt-6'>
        <h1 className='font-bold text-[22px] text-center'>Track Your Order</h1>
        <p className='text-[12px] text-gray-500 text-center mt-1'>Enter ORD ID to see if owner has seen & confirmed</p>
        <Card className='mt-6 p-5 rounded-[20px]'>
          <Input value={id} onChange={e=>setId(e.target.value)} placeholder='ORD-... e.g. ORD-172838...' className='h-12'/>
          <Button onClick={track} className='w-full h-12 rounded-full mt-3 font-bold'>Track Order</Button>
          {msg && <p className='text-[12px] text-red-500 mt-3 text-center'>{msg}</p>}
        </Card>

        {order && (
          <Card className='mt-4 p-5 rounded-[20px] bg-white'>
            <div className='flex items-center justify-between'>
              <p className='font-bold text-[14px]'>{order.id}</p>
              <span className={`text-[11px] px-3 py-1 rounded-full font-bold ${order.status==='Pending'?'bg-amber-100 text-amber-700': order.status==='Confirmed'?'bg-blue-100 text-blue-700': order.status==='Delivered'?'bg-green-100 text-green-700':'bg-gray-100'}`}>{order.status}</span>
            </div>
            <p className='text-[11px] text-gray-500 mt-2'>Shop: /s/{order.shopId}</p>
            <p className='text-[12px] mt-2'>Total: <span className='font-bold'>₦{order.total?.toLocaleString()}</span></p>
            <div className='mt-3 space-y-1'>
              {order.items?.map((it:any,i:number)=>(<p key={i} className='text-[11px]'>• {it.name} x{it.qty} - ₦{it.price?.toLocaleString()}</p>))}
            </div>

            <div className='mt-4 border-t pt-3 space-y-2'>
              <div className='flex items-center gap-2 text-[11px]'>
                <span>Owner seen?</span>
                <span className={`px-2 py-1 rounded-full font-bold ${order.status!=='Pending'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{order.status!=='Pending' ? '✓ Yes - '+order.status : '⏳ Not yet - Pending'}</span>
              </div>
              <div className='flex items-center gap-2 text-[11px]'>
                <span>You viewed?</span>
                <span className='px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-bold'>✓ Yes - You just viewed {new Date().toLocaleTimeString()}</span>
              </div>
              <p className='text-[10px] text-gray-400 mt-2'>Owner will see in Dashboard that you viewed this order {order.viewCount?`(Viewed ${order.viewCount} times)` : ''}. Blue tick like WhatsApp.</p>
            </div>

            <div className='mt-4 bg-[#F0FFF4] border border-green-200 rounded-[12px] p-3'>
              <p className='text-[11px] font-bold text-green-700'>Status meaning:</p>
              <p className='text-[10px] mt-1'>Pending = Owner not seen yet<br/>Confirmed = Owner seen & confirmed your order<br/>Shipped/Delivered = On the way/delivered<br/>If status still Pending, WhatsApp shop owner with your ORD ID</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
