import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, orderId, orderNumber } = await req.json();

    const secret = process.env.PAYSTACK_SECRET_KEY;
    
    // SAFE MODE: If you haven't registered for Paystack yet, don't crash
    if (!secret) {
      return NextResponse.json(
        { 
          error: "Paystack not configured yet - finish CAC registration first. App still works, just manual payment for now.",
          safe: true 
        },
        { status: 200 }
      );
    }

    if (!email || !amount) {
      return NextResponse.json({ error: "Email and amount required" }, { status: 400 });
    }

    // Amount in kobo for Paystack
    const amountInKobo = Math.round(Number(amount) * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference: `${orderNumber || orderId}-${Date.now()}`,
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          custom_fields: [
            {
              display_name: "Order Number",
              variable_name: "order_number",
              value: orderNumber,
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to initialize Paystack" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
