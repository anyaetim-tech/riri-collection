import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, order_number, customer_name, business_name, secret_key } = await req.json();

    if (!secret_key) {
      return NextResponse.json({ error: "Paystack secret key not set in Business Settings" }, { status: 400 });
    }
    if (!email || !amount) {
      return NextResponse.json({ error: "Email and amount required" }, { status: 400 });
    }

    // Paystack amount is in kobo (NGN * 100)
    const paystackAmount = Math.round(Number(amount) * 100);

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: paystackAmount,
        metadata: {
          order_number,
          customer_name,
          business_name,
          custom_fields: [
            { display_name: "Order Number", variable_name: "order_number", value: order_number },
            { display_name: "Business", variable_name: "business", value: business_name },
          ]
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?payment=success&order=${order_number}`,
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Paystack error" }, { status: 400 });
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}