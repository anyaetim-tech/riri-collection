"use client";
import { useState, useEffect } from 'react';
import { getProducts, Product, getShop, Shop, getOrders, saveOrders, Order, getCurrentUser } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import Link from 'next/link';
export default function ShopPage({params}:{params:{slug:string}}){
  const slug=params?.slug||'jamoy';
  const [shop,setShop]=useState<Shop|undefined>();
  const [products,setProducts]=useState<Product[]>([]);
  const [cart,setCart]=useState<{product:Product;qty:number}[]>([]);
  const [showCart,setShowCart]=useState(false);
  const [showCheckout,setShowCheckout]=useState(false);
  const [customer,setCustomer]=useState({name:'', phone:'', address:''});
  useEffect(()=>{ setShop(getShop(slug)); setProducts(getProducts(slug)); },[slug]);
  useEffect(()=>{ localStorage.setItem(`cart_${slug}`, JSON.stringify(cart)); },[cart, slug]);
  const addToCart=(p:Product)=>{ setCart(prev=>{ const ex=prev.find(i=>i.product.id===p.id); if(ex) return prev.map(i=>i.product.id===p.id?{...i, qty:i.qty+1}:i); return [...prev, {product:p, qty:1}]; }); };
  const total=cart.reduce((s,i)=>s+i.product.price*i.qty,0);
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const deliveryFee=shop?.deliveryFee||1500;
  const checkout=()=>{
    if(!customer.name || !customer.phone){ alert('Enter name and phone'); return; }
    const order:Order={ id:`ORD-${Date.now()}`, shopId:slug, customer, items:cart.map(c=>({id:c.product.id, name:c.product.name, price:c.product.price, qty:c.qty})), total:total+deliveryFee, deliveryFee, status:'Pending', payment:'Pending', delivery:'Pending', date:new Date().toISOString(), paymentMethod:'Transfer' };
    const existing=getOrders(slug); saveOrders(slug, [...existing, order]);
    const ownerNumber = (shop?.whatsapp||'2348137717359').replace(/\D/g,'');
    const itemsText = cart.map(c=>`${c.product.name} x${c.qty}`).join(', ');
    const msg = `🔔 NEW ORDER!%0AOrder: ${order.id}%0AShop: /s/${slug}%0ACustomer: ${customer.name}%0APhone: ${customer.phone}%0AAddress: ${customer.address}%0AItems: ${itemsText}%0ATotal: ₦${(total+deliveryFee).toLocaleString()}%0ATrack: ${order.id}`;
    const waOwner = `https://wa.me/${ownerNumber}?text=${msg}`;
    setCart([]); setShowCheckout(false); setShowCart(false);
    alert(`Order ${order.id} placed! Track at /track. Owner notified on WhatsApp.`);
    setTimeout(()=>window.open(waOwner,'_blank'),500);
  };
  const waLink=`https://wa.me/${shop?.whatsapp||'2348137717359'}?text=Hi%20I%20want%20to%20order%20from%20${shop?.name||'Jamoy'}`;
  return (
    <div className='min-h-screen bg-white pb-[90px]'>
      <header className='sticky top-0 z-20 bg-white border-b h-[56px] px-4 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'><img src='/logo.png' className='h-8 w-8 rounded-full border'/><div><p className='font-bold text-[14px]'>{shop?.name||'Jamoy'}</p><p className='text-[10px] text-gray-500'>/s/{slug} • WhatsApp Alert ON</p></div></div>
        <button onClick={()=>setShowCart(true)} className='h-9 px-4 rounded-full bg-black text-white text-[12px] font-bold'>Cart • {cartCount}</button>
      </header>
      <div className='p-3'><div className='rounded-[20px] bg-[#F8F5FF] border p-4 flex gap-3'><img src='/logo.png' className='h-14 w-14 rounded-[12px] bg-white border p-2'/><div><h1 className='font-bold'>{shop?.name||'Jamoy'} Boss Bags</h1><p className='text-[11px]'>Opay {shop?.accountNumber||'9155563698'} {shop?.accountName||'Joy'}</p><p className='text-[10px] text-green-600 font-bold mt-1'>🔔 You get WhatsApp when order drops</p><div className='mt-2 flex gap-2'><a href={waLink} target='_blank' className='h-8 px-4 rounded-full bg-[#25D366] text-white text-[11px] font-bold flex items-center justify-center'>WhatsApp</a><Link href='/track' className='h-8 px-4 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center'>Track</Link></div></div></div></div>
      <div className='p-3 grid grid-cols-2 gap-3'>{products.map(p=>(<div key={p.id} className='rounded-[16px] border overflow-hidden'><div className='aspect-[4/3] bg-gray-50'><img src={p.imageUrl} className='w-full h-full object-cover'/></div><div className='p-3'><p className='text-[12px] font-medium'>{p.name}</p><p className='font-bold'>₦{p.price.toLocaleString()}</p><button onClick={()=>addToCart(p)} className='mt-2 h-9 w-full rounded-full bg-black text-white text-[11px] font-bold'>Add to Cart</button></div></div>))}</div>
      {showCart && (<div className='fixed inset-0 z-50 flex items-end justify-center'><div className='absolute inset-0 bg-black/40' onClick={()=>setShowCart(false)}/><div className='relative w-full max-w-md bg-white rounded-t-[24px] max-h-[85vh] overflow-auto'><div className='p-5 border-b flex justify-between'><h2 className='font-bold'>Cart {cartCount}</h2><button onClick={()=>setShowCart(false)}>✕</button></div><div className='p-4'><Button onClick={()=>{setShowCart(false); setShowCheckout(true);}} className='w-full h-12 rounded-full'>Checkout → Notify Owner</Button></div></div></div>)}
      {showCheckout && (<div className='fixed inset-0 z-50 flex items-center justify-center p-4'><div className='absolute inset-0 bg-black/40' onClick={()=>setShowCheckout(false)}/><div className='relative w-full max-w-md bg-white rounded-[24px] p-6'><h2 className='font-bold'>Checkout • Owner gets WhatsApp alert</h2><div className='mt-4 space-y-3'><div><Label>Name *</Label><Input value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} className='mt-1'/></div><div><Label>Phone *</Label><Input value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} className='mt-1'/></div><div><Label>Address</Label><Input value={customer.address} onChange={e=>setCustomer({...customer, address:e.target.value})} className='mt-1'/></div><Button onClick={checkout} className='w-full h-12 rounded-full'>Place Order → WhatsApp Owner</Button></div></div></div>)}
    </div>
  );
}
