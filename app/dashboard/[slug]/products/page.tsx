"use client";
import { useState, useEffect, useRef } from 'react';
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
  const [preview,setPreview]=useState<string>('');
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{ setProducts(getProducts(slug)); },[slug]);

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file){ return; }
    if(file.size>4*1024*1024){ alert('Image too large! Use less than 4MB'); return; }
    setUploading(true);
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const base64=ev.target?.result as string;
      setForm(prev=>({...prev, imageUrl:base64}));
      setPreview(base64);
      setUploading(false);
    };
    reader.onerror=()=>{ alert('Failed to read image'); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleUrlChange=(url:string)=>{
    setForm(prev=>({...prev, imageUrl:url}));
    setPreview(url);
  };

  const add=()=>{
    if(!form.name.trim() || !form.price){ alert('Enter name and price'); return; }
    if(!form.imageUrl){ alert('Add image: upload from phone or paste URL'); return; }
    const np:any={
      id:Date.now().toString(),
      shopId:slug,
      name:form.name.trim(),
      sku:`SKU-${Date.now()}`,
      price:Number(form.price),
      stock:Number(form.stock)||10,
      image:'bag',
      imageUrl:form.imageUrl
    };
    const updated=[...products, np];
    saveProducts(slug, updated);
    setProducts(updated);
    setForm({name:'', price:'', imageUrl:'', stock:'10'});
    setPreview('');
    if(fileRef.current) fileRef.current.value='';
    alert('Product added! View in shop /s/'+slug);
  };

  const del=(id:string)=>{
    if(!confirm('Delete this product permanently?')) return;
    const updated=products.filter(p=>p.id!==id);
    saveProducts(slug, updated);
    setProducts(updated);
  };

  const deleteAll=()=>{
    if(products.length===0) return;
    if(!confirm(`Delete ALL ${products.length} products for /s/${slug}?`)) return;
    saveProducts(slug, []);
    setProducts([]);
  };

  const clearSamples=()=>{
    const updated=products.filter(p=> !p.name.toLowerCase().includes('starter') && !p.name.toLowerCase().includes('sample'));
    if(updated.length===products.length){ alert('No old samples'); return; }
    if(!confirm(`Remove ${products.length-updated.length} old samples?`)) return;
    saveProducts(slug, updated);
    setProducts(updated);
  };

  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4 sm:p-6 pb-20'>
      <div className='max-w-[1100px] mx-auto'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <img src='/logo.png' className='h-9 w-9 rounded-full border bg-white object-contain'/>
            <div>
              <h1 className='font-bold text-[18px]'>Products jamoy ({products.length})</h1>
              <p className='text-[11px] text-gray-500'>/s/{slug} • Clean • Delete • Upload from phone enabled</p>
            </div>
          </div>
          <Link href={`/s/${slug}`} className='h-9 px-4 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center'>View Shop → /s/{slug}</Link>
        </div>

        <div className='mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6'>
          {/* FORM WITH UPLOAD */}
          <div className='bg-white rounded-[20px] border p-5 h-fit lg:sticky lg:top-4 shadow-sm'>
            <h2 className='font-bold text-[14px]'>Add New Product • Perfect Build</h2>
            <p className='text-[10px] text-gray-400 mt-1'>Upload from phone or paste URL • All functions working</p>

            <div className='mt-4 space-y-4'>
              <div><Label>Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder='Beddings Gold / Boss Bag' className='mt-1 h-11'/></div>
              <div><Label>Price ₦ *</Label><Input value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder='30000' type='number' className='mt-1 h-11'/></div>

              {/* UPLOAD FROM PHONE/SYSTEM */}
              <div>
                <Label>Product Image * — Upload from phone/system</Label>
                <div className='mt-2 space-y-3'>
                  <div className='border-2 border-dashed rounded-[16px] p-4 bg-[#FAF9F7] text-center'>
                    <input ref={fileRef} type='file' accept='image/*' onChange={handleFile} className='hidden' id='file-upload'/>
                    <label htmlFor='file-upload' className='cursor-pointer flex flex-col items-center'>
                      <div className='h-10 w-10 rounded-full bg-black text-white flex items-center justify-center text-[18px]'>📸</div>
                      <p className='font-bold text-[12px] mt-2'>{uploading? 'Reading image...' : 'Click to upload from phone / system'}</p>
                      <p className='text-[10px] text-gray-500 mt-1'>JPG, PNG, WEBP • Max 4MB • Works on phone</p>
                      <div className='mt-3 h-9 px-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center'>Choose Image from Gallery</div>
                    </label>
                    {preview && (
                      <div className='mt-4'>
                        <img src={preview} className='w-full h-[160px] object-cover rounded-[12px] border bg-white'/>
                        <p className='text-[10px] text-green-600 font-bold mt-2'>✓ Image ready</p>
                      </div>
                    )}
                  </div>

                  <div className='flex items-center gap-2'>
                    <div className='flex-1 h-[1px] bg-gray-200'></div>
                    <span className='text-[10px] text-gray-400'>OR PASTE URL</span>
                    <div className='flex-1 h-[1px] bg-gray-200'></div>
                  </div>

                  <Input value={form.imageUrl.startsWith('data:')? '' : form.imageUrl} onChange={e=>handleUrlChange(e.target.value)} placeholder='https://... paste image link' className='h-11'/>
                  {form.imageUrl && !form.imageUrl.startsWith('data:') && (
                    <img src={form.imageUrl} className='w-full h-[120px] object-cover rounded-[12px] border mt-2' onError={e=>{(e.target as any).style.display='none'}}/>
                  )}
                </div>
              </div>

              <div><Label>Stock</Label><Input value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} placeholder='10' type='number' className='mt-1 h-11'/></div>

              <Button onClick={add} disabled={uploading} className='w-full h-12 rounded-full text-[13px] font-bold'>+ Add Product to Shop</Button>

              <div className='pt-3 border-t space-y-2'>
                <button onClick={clearSamples} className='w-full h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold'>🧹 Remove Old Samples</button>
                <button onClick={deleteAll} className='w-full h-9 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold'>🗑 Delete ALL Products</button>
              </div>

              <div className='bg-[#F8F5FF] border border-[#EDE7FF] rounded-[12px] p-3'>
                <p className='text-[10px] font-bold'>How to add from phone:</p>
                <p className='text-[10px] text-gray-600 mt-1'>1. Click "Choose Image from Gallery"<br/>2. Select from camera/gallery<br/>3. Enter name & price<br/>4. Click Add Product<br/>5. View Shop /s/jamoy to see it live</p>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div>
            <div className='flex items-center justify-between'>
              <h2 className='font-bold text-[14px]'>Your Products • {products.length}</h2>
              <span className='text-[10px] text-gray-400'>Neat • Delete • Upload working</span>
            </div>

            <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {products.map((p:any)=>(
                <div key={p.id} className='bg-white rounded-[16px] border overflow-hidden flex flex-col shadow-sm'>
                  <div className='relative'>
                    <img src={p.imageUrl||'/logo.png'} className='h-[200px] w-full object-cover bg-gray-50'/>
                    <button onClick={()=>del(p.id)} className='absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 backdrop-blur text-white flex items-center justify-center hover:bg-red-500'>✕</button>
                    <span className='absolute bottom-2 left-2 bg-black text-white text-[11px] px-3 py-1 rounded-full font-bold'>₦{p.price?.toLocaleString()}</span>
                  </div>
                  <div className='p-4 flex-1 flex flex-col'>
                    <p className='font-bold text-[13px] line-clamp-2'>{p.name}</p>
                    <p className='text-[11px] text-gray-500 mt-1'>Stock: {p.stock||10} • {p.sku}</p>
                    <div className='mt-3 flex gap-2'>
                      <button onClick={()=>del(p.id)} className='flex-1 h-9 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold'>🗑 Delete</button>
                      <Link href={`/s/${slug}`} className='flex-1 h-9 rounded-full bg-gray-100 text-[11px] font-bold flex items-center justify-center'>View Shop</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length===0 && (
              <div className='mt-6 bg-white border border-dashed rounded-[20px] p-10 text-center'>
                <div className='h-14 w-14 rounded-full bg-[#F8F5FF] border mx-auto flex items-center justify-center text-[20px]'>👜</div>
                <p className='text-[14px] font-bold mt-3'>No products yet</p>
                <p className='text-[11px] text-gray-500 mt-1'>Add from phone: Click "Choose Image from Gallery" on the left<br/>Enter beddings name, 30000, upload your bedding photo</p>
                <Link href={`/s/${slug}`} className='mt-4 inline-flex h-9 px-5 rounded-full bg-black text-white text-[11px] font-bold items-center justify-center'>Go to Shop /s/{slug}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
