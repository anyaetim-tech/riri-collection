import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// This route works WITHOUT Paystack registration. 
// It will just wait for events. No error if keys missing.

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;
    
    // If no secret yet (because you haven't registered), just accept but do nothing - no crash
    if (!secret) {
      console.log("Paystack secret not set yet - webhook received but ignored (safe mode)");
      return NextResponse.json({ status: "ok - keys not set yet" }, { status: 200 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify signature - security
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Only care about successful charge
    if (event.event === "charge.success") {
      const reference = event.data.reference;
      const amountPaid = event.data.amount / 100; // Paystack sends in kobo

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        // use service role if you have it, else anon works with RLS policies
      );

      // Find order by paystack reference (you saved reference when creating link)
      // Your orders table should have paystack_reference column - create if missing
      const { data: order, error: findError } = await supabase
        .from("orders")
        .select("id, total, paid_amount")
        .eq("paystack_reference", reference)
        .maybeSingle();

      if (findError) console.error("Find order error:", findError);

      if (order) {
        // Auto-mark as paid
        const newPaid = (order.paid_amount || 0) + amountPaid;
        const paymentStatus = newPaid >= order.total ? "paid" : "partial";

        await supabase
          .from("orders")
          .update({
            paid_amount: newPaid,
            payment_status: paymentStatus,
            status: paymentStatus === "paid" ? "confirmed" : "pending",
          })
          .eq("id", order.id);

        // Also log in payments table
        await supabase.from("payments").insert({
          order_id: order.id,
          amount: amountPaid,
          method: "paystack",
          reference: reference,
          status: "success",
        });

        console.log(`Order ${order.id} auto-marked as ${paymentStatus} via Paystack`);
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Paystack requires quick 200 response
export const dynamic = "force-dynamic";
