"use client";

export function BankTransferCard({ amount, orderNumber }: { amount: number, orderNumber: string }) {
  const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const bankName = "Opay";
  const accountNumber = "9064301203";
  const accountName = "Riri collections";
  const whatsappNumber = "2349064301203";

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  const whatsappMessage = encodeURIComponent(`Hello Riri Collection! I just placed order ${orderNumber}. I have transferred ${formattedAmount} to ${bankName} ${accountNumber}. Here is my proof:`);
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="mt-4 bg-white rounded-xl p-4 text-left text-black border-2 border-black/10">
      <h3 className="font-bold text-lg mb-1">💳 Pay via Bank Transfer</h3>
      <p className="text-sm text-gray-600 mb-3">Please transfer and send proof on WhatsApp. Order will be confirmed once payment is received.</p>

      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Amount to Pay</span>
          <span className="font-bold text-purple-700">{formattedAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Bank</span>
          <span className="font-semibold">{bankName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Account Number</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wide">{accountNumber}</span>
            <button onClick={() => copy(accountNumber)} className="text-xs bg-black text-white px-2 py-1 rounded">Copy</button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Account Name</span>
          <span className="font-semibold">{accountName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Reference</span>
          <span className="font-mono font-bold">{orderNumber}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <a href={whatsappLink} target="_blank" className="flex-1 bg-green-600 text-white text-center py-3 rounded-lg font-bold hover:bg-green-700">
          📱 Send Proof on WhatsApp
        </a>
      </div>

      <p className="mt-2 text-[11px] text-gray-500 text-center">Use Order Number {orderNumber} as narration so we confirm you fast.</p>
    </div>
  );
}