import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// For browser testing - so you see it works
export async function GET() {
  return NextResponse.json({ 
    status: "Riri Collections Paystack Webhook is LIVE ✅",
    message: "Ready and waiting for Paystack. Safe mode active (no keys yet).",
    note: "Paystack will use POST, not GET. This GET is just for you to check it's alive."
  }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;
    
    if (!secret) {
      console.log("Paystack secret not set yet - webhook received but ignored (safe mode)");
      return NextResponse.json({ status: "ok - keys not set yet, safe mode" }, { status: 200 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const amountPaid = event.data.amount / 100;

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: order } = await supabase
        .from("orders")
        .select("id, total, paid_amount")
        .eq("paystack_reference", reference)
        .maybeSingle();

      if (order) {
        const newPaid = (order.paid_amount || 0) + amountPaid;
        const paymentStatus = newPaid >= order.total ? "paid" : "partial";

        await supabase.from("orders").update({
          paid_amount: newPaid,
          payment_status: paymentStatus,
          status: paymentStatus === "paid" ? "confirmed" : "pending",
        }).eq("id", order.id);

        await supabase.from("payments").insert({
          order_id: order.id,
          amount: amountPaid,
          method: "paystack",
          reference: reference,
          status: "success",
        });
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";