"use client"
export type Shop={id:string;slug:string;name:string;ownerId:string;whatsapp?:string;bankName?:string;accountNumber?:string;accountName?:string}
export type Product={id:string;shopId:string;name:string;sku:string;price:number;stock:number;imageUrl?:string}
export type User={id:string;email:string;name:string}
const SK='riri_neat_shops'
const UK='riri_neat_users'
const CK='riri_neat_current'
const kf=(s:string,t:string)=>`riri_neat_${t}_${s}`
export const getCurrentUser=():any=>{if(typeof window==='undefined')return null;try{return JSON.parse(localStorage.getItem(CK)||'null')}catch{return null}}
export const setCurrentUser=(u:any)=>{if(u)localStorage.setItem(CK,JSON.stringify(u));else localStorage.removeItem(CK);window.dispatchEvent(new Event('riri-auth-change'))}
export const logoutUser=()=>{localStorage.removeItem(CK);window.dispatchEvent(new Event('riri-auth-change'))}
export const getUsers=():any[]=>{try{return JSON.parse(localStorage.getItem(UK)||'[]')}catch{return[]}}
export const saveUsers=(u:any[])=>localStorage.setItem(UK,JSON.stringify(u))
export const signupUser=(n:string,e:string,p:string)=>{const us=getUsers();const lo=e.toLowerCase().trim();if(us.some((x:any)=>x.email.toLowerCase()===lo))throw new Error('Email exists');const nu={id:Date.now().toString(),email:lo,name:n.trim(),phone:p.trim()};saveUsers([...us,nu]);setCurrentUser(nu);return nu}
export const getShops=():any[]=>{try{const r=localStorage.getItem(SK);if(!r){const d=[{id:'1',slug:'riri-collection',name:'Riri Collection',ownerId:'1',whatsapp:'2349064301203',bankName:'Opay',accountNumber:'9064301203',accountName:'Riri'},{id:'2',slug:'jamoy',name:'Jamoy',ownerId:'2',whatsapp:'2348137717359',bankName:'Opay',accountNumber:'9155563698',accountName:'Joy'}];localStorage.setItem(SK,JSON.stringify(d));return d;}return JSON.parse(r)}catch{return[]}}
export const getShop=(s:string|undefined)=>getShops().find((x:any)=>x.slug===s)
export const getProducts=(s:string|undefined):any[]=>{try{const r=localStorage.getItem(kf(s||'','products'));if(!r){const d=[{id:'1',shopId:s,name:'Boss Bag - Starter',sku:'1',price:25000,stock:10,imageUrl:'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500'},{id:'2',shopId:s,name:'Sample Product',sku:'2',price:15000,stock:5,imageUrl:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'}];localStorage.setItem(kf(s||'','products'),JSON.stringify(d));return d;}return JSON.parse(r)}catch{return[]}}
export const saveProducts=(s:string,p:any[])=>localStorage.setItem(kf(s,'products'),JSON.stringify(p))
export const getOrders=(s:string|undefined):any[]=>{try{return JSON.parse(localStorage.getItem(kf(s||'','orders'))||'[]')}catch{return[]}}
export const getAllOrders=():any[]=>{let a:any[]=[];getShops().forEach((s:any)=>{a=[...a,...getOrders(s.slug)];});return a}
