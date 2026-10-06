
export type Product = any;
export type Shop = any;
export type Order = any;

const safeGet = (key:string)=>{
  if(typeof window==='undefined') return null;
  try{ return localStorage.getItem(key); }catch{ return null; }
};
const safeSet = (key:string, val:string)=>{
  if(typeof window==='undefined') return;
  try{ localStorage.setItem(key, val); }catch{}
};

export const getProducts = (slug:string):any[]=>{
  if(typeof window==='undefined') return [];
  try{
    const data = safeGet(`products_${slug}`);
    if(data) return JSON.parse(data);
    const all = safeGet('products');
    if(all){ const parsed=JSON.parse(all); return Array.isArray(parsed)?parsed:[]; }
  }catch{}
  return [];
};
export const saveProducts = (slug:string, products:any[])=>{
  safeSet(`products_${slug}`, JSON.stringify(products));
  safeSet('products', JSON.stringify(products));
};
export const getOrders = (slug:string):any[]=>{
  if(typeof window==='undefined') return [];
  try{
    const data = safeGet(`orders_${slug}`);
    if(data) return JSON.parse(data);
  }catch{}
  return [];
};
export const saveOrders = (slug:string, orders:any[])=>{
  safeSet(`orders_${slug}`, JSON.stringify(orders));
};
export const getShop = (slug:string):any=>{
  if(typeof window==='undefined') return {name:slug, whatsapp:'2348137717359', deliveryFee:1500};
  try{
    const data = safeGet(`shop_${slug}`);
    if(data) return JSON.parse(data);
  }catch{}
  return {name:slug, whatsapp:'2348137717359', deliveryFee:1500, slug};
};
export const saveShop = (slug:string, shop:any)=>{ safeSet(`shop_${slug}`, JSON.stringify(shop)); };
export const getCurrentUser = ()=>{ 
  if(typeof window==='undefined') return null;
  try{ const u=safeGet('currentUser'); return u?JSON.parse(u):null; }catch{ return null; }
};
export const getShops = ():any[]=>{ 
  if(typeof window==='undefined') return [];
  try{ const d=safeGet('shops'); return d?JSON.parse(d):[]; }catch{ return []; }
};
