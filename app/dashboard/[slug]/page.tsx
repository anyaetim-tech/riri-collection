"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProducts, getOrders, getShop } from '@/lib/store';
import Link from 'next/link';

export default function DashboardPage(){
  const params=useParams();
  const slug=(params?.slug as string)||'jomal';
  const [products,setProducts]=useState<any[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  const [shop,setShop]=useState<any>(null);
  const [mounted,setMounted]=useState(false);
  
  useEffect(()=>{
    setMounted(true);
    setProducts(getProducts(slug));
    setOrders(getOrders(slug));
    setShop(getShop(slug));
  },[slug]);

  if(!mounted) return <div className='min-h-screen bg-[#FAF9F7] p-4'>Loading...</div>;

  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4'>
      <div className='max-w-[1100px] mx-auto'>
        <h1 className='font-bold text-[22px]'>Dashboard {slug}</h1>
        <p className='text-[12px] text-gray-500'>Shop: {shop?.name||slug}</p>
        
        <div className='mt-4 grid grid-cols-2 gap-3'>
          <div className='bg-white rounded-[16px] border p-4'><p className='text-[11px] text-gray-500'>Products</p><p className='font-bold text-[20px]'>{products.length}</p></div>
          <div className='bg-white rounded-[16px] border p-4'><p className='text-[11px] text-gray-500'>Orders</p><p className='font-bold text-[20px]'>{orders.length}</p></div>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-3'>
          <Link href={`/dashboard/${slug}/products`} className='h-14 rounded-[16px] bg-black text-white flex items-center justify-center font-bold'>📦 Products ({products.length}) - Add Beddings</Link>
          <Link href={`/dashboard/${slug}/orders`} className='h-14 rounded-[16px] bg-white border flex items-center justify-center font-bold'>📋 Orders ({orders.length}) - WhatsApp + Seen</Link>
          <Link href={`/s/${slug}`} className='h-14 rounded-[16px] bg-[#25D366] text-white flex items-center justify-center font-bold'>🛍️ View Shop - Test Order</Link>
          <Link href={`/track`} className='h-14 rounded-[16px] bg-white border flex items-center justify-center font-bold'>🔍 Track Order</Link>
          <Link href={`/`} className='h-12 rounded-full bg-white border flex items-center justify-center text-[12px] font-bold'>← Home</Link>
        </div>

        <div className='mt-8 bg-white rounded-[16px] border p-4'>
          <p className='font-bold text-[13px]'>Why blank before?</p>
          <p className='text-[11px] mt-1'>Old code read localStorage on server = client-side exception. This version checks window first, so it loads.</p>
        </div>
      </div>
    </div>
  );
}
