"use client";
import { useState, useEffect } from 'react';
import { getProducts, Product, getShop, Shop, getOrders, saveOrders, Order, getCurrentUser } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import Link from 'next/link';

export default function ShopPage({params}:{params:{slug:string}}){
  const slug=params?.slug||'jamoy';
  const [shop,setShop]=useState<Shop|undefined>();
  const [products,setProducts]=useState<Product[]>([]);
  const [cart,setCart]=useState<{product:Product;qty:number}[]>([]);
  const [showCart,setShowCart]=useState(false);
  const [showCheckout,setShowCheckout]=useState(false);
  const [customer,setCustomer]=useState({name:'', phone:'', address:''});
  const [isOwner,setIsOwner]=useState(false);
  useEffect(()=>{
    setShop(getShop(slug));
    setProducts(getProducts(slug));
    const u=getCurrentUser();
    if(u) setIsOwner(true);
    const saved=localStorage.getItem(`cart_${slug}`);
    if(saved) try{setCart(JSON.parse(saved));}catch{}
  },[slug]);
  useEffect(()=>{ localStorage.setItem(`cart_${slug}`, JSON.stringify(cart)); },[cart, slug]);
  const addToCart=(p:Product)=>{
    setCart(prev=>{
      const ex=prev.find(i=>i.product.id===p.id);
      if(ex) return prev.map(i=>i.product.id===p.id?{...i, qty:i.qty+1}:i);
      return [...prev, {product:p, qty:1}];
    });
  };
  const total=cart.reduce((s,i)=>s+i.product.price*i.qty,0);
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const deliveryFee=shop?.deliveryFee||1500;
  const checkout=()=>{
    if(!customer.name || !customer.phone){ alert('Enter name and phone'); return; }
    const orderId=`ORD-${Date.now()}`;
    const order:any={
      id:orderId,
      shopId:slug,
      customerName:customer.name,
      customerPhone:customer.phone,
      customerAddress:customer.address,
      customer:customer,
      items:cart.map(c=>({id:c.product.id, name:c.product.name, price:c.product.price, qty:c.qty})),
      total:total+deliveryFee,
      deliveryFee,
      status:'Pending',
      payment:'Pending',
      delivery:'Pending',
      date:new Date().toISOString(),
      createdAt:new Date().toISOString(),
      paymentMethod:'Transfer',
      viewedByOwner:false,
      viewedByCustomer:false
    };
    const existing=getOrders(slug);
    saveOrders(slug, [...existing, order]);
    const itemsText = cart.map(c=>`${c.product.name} x${c.qty} = ₦${(c.product.price*c.qty).toLocaleString()}`).join('\n');
    const msg = `🔔 NEW ORDER ${orderId}\n\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nAddress: ${customer.address}\n\nItems:\n${itemsText}\n\nDelivery: ₦${deliveryFee}\nTotal: ₦${(total+deliveryFee).toLocaleString()}\n\nTrack: ${window.location.origin}/track?order=${orderId}`;
    const ownerPhone = (shop?.whatsapp||'2348137717359').replace(/[^0-9]/g,'');
    const waUrl = `https://wa.me/${ownerPhone}?text=${encodeURIComponent(msg)}`;
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
    try{ localStorage.removeItem(`cart_${slug}`); }catch{}
    window.open(waUrl, '_blank');
    setTimeout(()=>{
      alert(`✅ Order ${orderId} placed! WhatsApp opened. Track ID: ${orderId}`);
      window.location.href = `/track?order=${orderId}`;
    }, 500);
  };
  const waLink=`https://wa.me/${shop?.whatsapp||'2348137717359'}?text=Hi%20I%20want%20to%20order%20from%20${shop?.name||'Jamoy'}`;
  return (
    <div className='min-h-screen bg-white pb-[90px]'>
      <header className='sticky top-0 z-20 bg-white border-b h-[56px] px-4 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <img src='/logo.png' className='h-8 w-8 rounded-full border bg-white object-contain'/>
          <div className='min-w-0'>
            <p className='font-bold text-[14px] leading-none truncate'>{shop?.name||'Jamoy'}</p>
            <p className='text-[10px] text-gray-500 truncate'>/s/{slug} • Boss Bags</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Link href={`/dashboard/${slug}`} className='h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center'>⚙</Link>
          <button onClick={()=>setShowCart(true)} className='h-9 px-4 rounded-full bg-black text-white text-[12px] font-bold'>Cart • {cartCount}</button>
        </div>
      </header>
      <div className='p-3'>
        <div className='rounded-[20px] bg-[#F8F5FF] border border-[#EDE7FF] p-4 flex gap-3'>
          <img src='/logo.png' className='h-14 w-14 rounded-[12px] bg-white border p-2 object-contain shrink-0'/>
          <div className='min-w-0 flex-1'>
            <h1 className='font-bold text-[16px] leading-tight truncate'>{shop?.name||'Jamoy'} Boss Bags</h1>
            <p className='text-[11px] text-gray-600 mt-1 truncate'>Pay to Opay <span className='font-bold text-black'>{shop?.accountNumber||'9155563698'} {shop?.accountName||'Joy'}</span></p>
            <div className='mt-3 flex gap-2'>
              <a href={waLink} target='_blank' className='h-8 px-4 rounded-full bg-[#25D366] text-white text-[11px] font-bold flex items-center justify-center'>WhatsApp</a>
              <Link href='/track' className='h-8 px-4 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center'>Track</Link>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className='mt-3 flex gap-2'>
            <Link href={`/dashboard/${slug}`} className='flex-1 h-10 rounded-full bg-black text-white text-[12px] font-bold flex items-center justify-center'>Dashboard</Link>
            <Link href={`/dashboard/${slug}/products`} className='flex-1 h-10 rounded-full bg-[#6B21A8] text-white text-[12px] font-bold flex items-center justify-center'>Add Product</Link>
            <Link href='/' className='h-10 px-4 rounded-full bg-gray-100 text-[12px] font-bold flex items-center justify-center'>Home</Link>
          </div>
        )}
      </div>
      <div className='px-4 flex items-center justify-between'>
        <p className='font-bold text-[14px]'>Boss Bags • {products.length} products</p>
        <span className='text-[10px] text-gray-400'>Neat • Professional</span>
      </div>
      <div className='p-3 grid grid-cols-2 gap-3'>
        {products.map(p=>(
          <div key={p.id} className='rounded-[16px] border bg-white overflow-hidden flex flex-col'>
            <div className='aspect-[4/3] bg-gray-50'><img src={p.imageUrl||'/logo.png'} className='w-full h-full object-cover'/></div>
            <div className='p-3 flex-1 flex flex-col'>
              <p className='text-[12px] font-medium line-clamp-2 min-h-[32px]'>{p.name}</p>
              <p className='font-bold text-[14px] mt-1'>₦{p.price.toLocaleString()}</p>
              <button onClick={()=>addToCart(p)} className='mt-3 h-9 w-full rounded-full bg-black text-white text-[11px] font-bold'>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
      {showCart && (
        <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <div className='absolute inset-0 bg-black/40' onClick={()=>setShowCart(false)}/>
          <div className='relative w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] max-h-[85vh] overflow-y-auto'>
            <div className='p-5 border-b flex items-center justify-between'>
              <h2 className='font-bold text-[16px]'>Cart • {cartCount} items</h2>
              <button onClick={()=>setShowCart(false)} className='h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center'>✕</button>
            </div>
            <div className='p-4 space-y-3'>
              {cart.length===0 && <p className='text-[13px] text-gray-500 text-center py-10'>Cart empty</p>}
              {cart.map(item=>(
                <div key={item.product.id} className='flex gap-3 border rounded-[12px] p-3'>
                  <img src={item.product.imageUrl} className='h-14 w-14 rounded-[8px] object-cover bg-gray-50'/>
                  <div className='flex-1 min-w-0'>
                    <p className='text-[12px] font-medium truncate'>{item.product.name}</p>
                    <p className='text-[12px] font-bold'>₦{item.product.price.toLocaleString()} x {item.qty}</p>
                  </div>
                  <button onClick={()=>setCart(cart.filter(c=>c.product.id!==item.product.id))} className='text-[11px] text-red-500 font-bold'>Remove</button>
                </div>
              ))}
              {cart.length>0 && (
                <>
                  <div className='border-t pt-3 space-y-1 text-[13px]'>
                    <div className='flex justify-between'><span>Subtotal</span><span>₦{total.toLocaleString()}</span></div>
                    <div className='flex justify-between'><span>Delivery</span><span>₦{deliveryFee.toLocaleString()}</span></div>
                    <div className='flex justify-between font-bold text-[15px] pt-2 border-t'><span>Total</span><span>₦{(total+deliveryFee).toLocaleString()}</span></div>
                  </div>
                  <Button onClick={()=>{setShowCart(false); setShowCheckout(true);}} className='w-full h-12 rounded-full mt-2'>Checkout →</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showCheckout && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/40' onClick={()=>setShowCheckout(false)}/>
          <div className='relative w-full max-w-md bg-white rounded-[24px] p-6'>
            <h2 className='font-bold text-[18px]'>Checkout</h2>
            <p className='text-[11px] text-gray-500 mt-1'>Pay to Opay {shop?.accountNumber} {shop?.accountName}</p>
            <div className='mt-4 space-y-3'>
              <div><Label>Name *</Label><Input value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} placeholder='Your name' className='mt-1'/></div>
              <div><Label>Phone *</Label><Input value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} placeholder='081...' className='mt-1'/></div>
              <div><Label>Address</Label><Input value={customer.address} onChange={e=>setCustomer({...customer, address:e.target.value})} placeholder='Delivery address' className='mt-1'/></div>
              <Button onClick={checkout} className='w-full h-12 rounded-full'>Place Order → Track</Button>
              <button onClick={()=>setShowCheckout(false)} className='w-full h-10 rounded-full border text-[12px] font-bold'>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t px-3 py-3 flex gap-2 z-10'>
        <Link href='/' className='flex-1 h-11 rounded-full bg-gray-100 text-[12px] font-bold flex items-center justify-center'>Home</Link>
        <a href={waLink} target='_blank' className='flex-[1.5] h-11 rounded-full bg-[#25D366] text-white text-[12px] font-bold flex items-center justify-center'>WhatsApp Shop</a>
        <Link href={`/dashboard/${slug}`} className='h-11 w-11 rounded-full bg-black text-white flex items-center justify-center'>⚙</Link>
      </div>
    </div>
  );
}
