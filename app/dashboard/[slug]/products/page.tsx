"use client";
import { useState, useEffect, useRef } from 'react';
import { getProducts, saveProducts, Product } from '@/lib/store';
import { useParams } from 'next/navigation';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProductsPage(){
  const params=useParams(); 
  const slug=(params?.slug as string)||'jomal';
  const [products,setProducts]=useState<Product[]>([]);
  const [form,setForm]=useState({name:'', price:'', imageUrl:'', stock:'10'});
  const [preview,setPreview]=useState<string>('');
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{ setProducts(getProducts(slug)); },[slug]);

  const handleFile=(e:any)=>{ 
    const file=e.target.files?.[0]; 
    if(!file) return; 
    const reader=new FileReader(); 
    reader.onload=(ev)=>{ 
      const b64=ev.target?.result as string; 
      setForm(p=>({...p, imageUrl:b64})); 
      setPreview(b64); 
    }; 
    reader.readAsDataURL(file); 
  };

  const add=()=>{ 
    if(!form.name.trim() || !form.price){ alert('Enter name and price'); return; } 
    let finalImage=form.imageUrl || preview || '/logo.png'; 
    const np:any={ id:Date.now().toString(), shopId:slug, name:form.name.trim(), sku:`SKU-${Date.now()}`, price:Number(form.price), stock:Number(form.stock)||10, image:'bag', imageUrl:finalImage }; 
    const updated=[...products, np]; 
    saveProducts(slug, updated); 
    setProducts(updated); 
    setForm({name:'', price:'', imageUrl:'', stock:'10'}); 
    setPreview(''); 
    if(fileRef.current) fileRef.current.value=''; 
    alert('Added: '+np.name); 
  };

  const del=(id:string)=>{ if(!confirm('Delete?')) return; const u=products.filter(p=>p.id!==id); saveProducts(slug,u); setProducts(u); };

  return (
    <div className='min-h-screen bg-[#FAF9F7] p-4'>
      <div className='max-w-[1100px] mx-auto'>
        <div className='flex items-center gap-2 flex-wrap mb-4'>
          <Link href={`/dashboard/${slug}`} className='h-9 px-4 rounded-full bg-black text-white text-[12px] font-bold flex items-center'>← Back to Dashboard</Link>
          <Link href={`/s/${slug}`} className='h-9 px-4 rounded-full bg-white border text-[12px] font-bold flex items-center'>View Shop</Link>
          <Link href={`/dashboard/${slug}/orders`} className='h-9 px-4 rounded-full bg-white border text-[12px] font-bold flex items-center'>Orders</Link>
          <Link href='/' className='h-9 px-4 rounded-full bg-white border text-[12px] font-bold flex items-center'>Home</Link>
        </div>

        <h1 className='font-bold mt-2 text-[18px]'>Products {slug} ({products.length}) FIXED - Back Button Added</h1>
        <p className='text-[11px] text-green-600 font-bold'>Image optional - leave empty and it will still add - Build Fixed for Vercel</p>
        
        <div className='mt-4 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6'>
          <div className='bg-white rounded-[20px] border p-5 h-fit'>
            <Label>NAME *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder='beddings' className='mt-1 h-11'/>
            <Label className='mt-3'>PRICE ₦ *</Label><Input value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder='30000' type='number' className='mt-1 h-11'/>
            <Label className='mt-3'>IMAGE - Upload from phone (optional)</Label>
            <div className='mt-2 border-2 border-dashed rounded-[16px] p-4 bg-[#FAF9F7] text-center'>
              <input ref={fileRef} type='file' accept='image/*' onChange={handleFile} className='hidden' id='file-upload'/>
              <label htmlFor='file-upload' className='cursor-pointer'><div className='h-10 w-10 rounded-full bg-black text-white mx-auto flex items-center justify-center'>📸</div><p className='font-bold text-[12px] mt-2'>Choose from phone</p></label>
              {preview && <img src={preview} className='mt-3 w-full h-[120px] object-cover rounded-[12px] border'/>}
            </div>
            <Input value={form.imageUrl.startsWith('data:')?'':form.imageUrl} onChange={e=>{setForm({...form, imageUrl:e.target.value}); setPreview(e.target.value);}} placeholder='https://... optional' className='mt-3 h-11'/>
            <Button onClick={add} className='w-full h-12 rounded-full mt-4 font-bold'>+ Add Product (FIXED - works without image)</Button>
          </div>
          <div>
            <h2 className='font-bold'>Your Products {products.length}</h2>
            <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {products.map((p:any)=>(
                <div key={p.id} className='bg-white border rounded-[16px] overflow-hidden'>
                  <img src={p.imageUrl} className='h-[180px] w-full object-cover'/>
                  <div className='p-3'><p className='font-bold text-[13px]'>{p.name}</p><p className='font-bold'>₦{p.price?.toLocaleString()}</p><button onClick={()=>del(p.id)} className='mt-2 text-[11px] text-red-600 font-bold'>Delete</button></div>
                </div>
              ))}
            </div>
            {products.length===0 && <p className='mt-6 text-center text-gray-500'>No products yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
