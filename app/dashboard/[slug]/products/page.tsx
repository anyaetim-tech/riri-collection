"use client";
import { useState, useEffect } from 'react';
import { getProducts, saveProducts, Product } from '@/lib/store';
import { useParams } from 'next/navigation';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProductsPage(){
  const params=useParams();
  const slug=(params?.slug as string)||'jamoy';
  const [products,setProducts]=useState<Product[]>([]);
  const [form,setForm]=useState({name:'', price:'', imageUrl:'', stock:'10'});

  useEffect(()=>{ setProducts(getProducts(slug)); },[slug]);

  const add=()=>{
    if(!form.name || !form.price){ alert('Enter name and price'); return; }
    const np:any={
      id:Date.now().toString(),
      shopId:slug,
      name:form.name.trim(),
      sku:`SKU-${Date.now()}`,
      price:Number(form.price),
      stock:Number(form.stock)||10,
      image:'bag',
      imageUrl:form.imageUrl.trim()||'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'
    };
    const updated=[...products, np];
    saveProducts(slug, updated);
    setProducts(updated);
    setForm({name:'', price:'', imageUrl:'', stock:'10'});
  };

  const del=(id:string)=>{
    if(!confirm('Delete this product permanently?')) return;
    const updated=products.filter(p=>p.id!==id);
    saveProducts(slug, updated);
    setProducts(updated);
  };

  const deleteAll=()=>{
    if(products.length===0) return;
    if(!confirm(`Delete ALL ${products.length} products for /s/${slug}? This cannot be undone.`)) return;
    saveProducts(slug, []);
    setProducts([]);
  };

  const clearOldSamples=()=>{
    // Remove the 2 default samples
    const updated=products.filter(p=> !p.name.toLowerCase().includes('starter') && !p.name.toLowerCase().includes('sample'));
    if(updated.length===products.length){ alert('No old sample products found'); return; }
    if(!confirm(`Remove ${products.length-updated.length} old sample products?`)) return;
    saveProducts(slug, updated);
    setProducts(updated);
  };

  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4 sm:p-6 pb-20'>
      <div className='max-w-[1000px] mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <img src='/logo.png' className='h-8 w-8 rounded-full border bg-white'/>
            <div>
              <h1 className='font-bold text-[18px]'>Products jamoy ({products.length})</h1>
              <p className='text-[11px] text-gray-500'>/s/{slug} • Clean • Delete enabled</p>
            </div>
          </div>
          <div className='flex gap-2'>
            <Link href={`/s/${slug}`} className='h-9 px-4 rounded-full bg-white border text-[11px] font-bold flex items-center justify-center'>View Shop → /s/{slug}</Link>
          </div>
        </div>

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6'>
          {/* ADD FORM */}
          <div className='bg-white rounded-[16px] border p-5 h-fit sticky top-4'>
            <h2 className='font-bold text-[14px]'>Add New Product</h2>
            <div className='mt-4 space-y-3'>
              <div><Label>Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder='Boss Bag Gold / Beddings' className='mt-1'/></div>
              <div><Label>Price ₦ *</Label><Input value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder='30000' type='number' className='mt-1'/></div>
              <div><Label>Image URL (paste link)</Label><Input value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} placeholder='https://...' className='mt-1'/></div>
              <div><Label>Stock</Label><Input value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} placeholder='10' type='number' className='mt-1'/></div>
              <Button onClick={add} className='w-full h-11 rounded-full mt-2'>+ Add Product</Button>
              <div className='pt-3 border-t space-y-2'>
                <button onClick={clearOldSamples} className='w-full h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold'>🧹 Remove Old Samples (Starter/Sample)</button>
                <button onClick={deleteAll} className='w-full h-9 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold'>🗑 Delete ALL Products</button>
              </div>
              <p className='text-[10px] text-gray-400'>Tip: To delete one product, use the ✕ or Delete button on its card</p>
            </div>
          </div>

          {/* PRODUCTS GRID - WITH DELETE BUTTONS */}
          <div>
            <div className='flex items-center justify-between'>
              <h2 className='font-bold text-[14px]'>Your Products • {products.length}</h2>
              <span className='text-[10px] text-gray-400'>Neat • No overlap • Delete enabled</span>
            </div>
            <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {products.map((p:any)=>(
                <div key={p.id} className='bg-white rounded-[16px] border overflow-hidden flex flex-col shadow-sm'>
                  <div className='relative'>
                    <img src={p.imageUrl||'/logo.png'} className='h-[180px] w-full object-cover bg-gray-50'/>
                    <button onClick={()=>del(p.id)} className='absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur text-white flex items-center justify-center hover:bg-red-500'>✕</button>
                    <span className='absolute bottom-2 left-2 bg-black text-white text-[10px] px-2 py-1 rounded-full'>₦{p.price?.toLocaleString()}</span>
                  </div>
                  <div className='p-4 flex-1 flex flex-col'>
                    <p className='font-bold text-[13px] line-clamp-2'>{p.name}</p>
                    <p className='text-[11px] text-gray-500 mt-1'>Stock: {p.stock||10} • SKU: {p.sku}</p>
                    <div className='mt-3 flex gap-2'>
                      <button onClick={()=>del(p.id)} className='flex-1 h-9 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-100'>🗑 Delete</button>
                      <Link href={`/s/${slug}`} className='flex-1 h-9 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center'>View in Shop</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {products.length===0 && (
              <div className='mt-6 bg-white border border-dashed rounded-[16px] p-10 text-center'>
                <p className='text-[14px] font-bold'>No products yet</p>
                <p className='text-[11px] text-gray-500 mt-1'>Add your Boss Bags or Beddings using the form on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
