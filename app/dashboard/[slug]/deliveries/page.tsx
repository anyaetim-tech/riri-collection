
"use client";
import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/card';
import { getOrders, Order, updateOrderStatus } from '@/lib/store';
export default function Deliveries({params}:{params:{slug:string}}){
  const slug=params?.slug||'riri-collection';
  const [orders,setOrders]=useState<Order[]>([]);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ setMounted(true); setOrders(getOrders(slug)); },[slug]);
  const update=(id:string,s:string)=>{ updateOrderStatus(slug,id,{delivery:s} as any); setOrders(getOrders(slug)); };
  if(!mounted) return <div className='p-10'>Loading...</div>;
  return <DashboardShell shopSlug={slug} title='Deliveries 🚚'><div className='grid grid-cols-3 gap-3'><Card className='p-4'><p className='text-[11px]'>Pending</p><p className='font-bold text-[20px]'>{orders.filter(o=>o.delivery==='Pending').length}</p></Card><Card className='p-4'><p className='text-[11px]'>Out for Delivery</p><p className='font-bold text-[20px]'>{orders.filter(o=>o.delivery==='Out for Delivery').length}</p></Card><Card className='p-4'><p className='text-[11px]'>Delivered</p><p className='font-bold text-[20px]'>{orders.filter(o=>o.delivery==='Delivered').length}</p></Card></div><div className='mt-6 space-y-3'>{orders.map(o=><Card key={o.id} className='p-4 flex justify-between'><div><p className='font-bold text-[12px]'>{o.id} — {o.customer?.name}</p><p className='text-[11px]'>{o.customer?.address} • ₦{o.total?.toLocaleString()}</p></div><select value={o.delivery} onChange={e=>update(o.id,e.target.value)} className='h-9 rounded-full border px-3 text-[11px] font-bold'><option>Pending</option><option>Preparing</option><option>Out for Delivery</option><option>Delivered</option></select></Card>)}</div></DashboardShell>
}
