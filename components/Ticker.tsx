const FEATURES = [
  '200+ countries supported',
  'Instant delivery',
  'Auto-refund on failure',
  'Fund via card, bank transfer, or manual',
  '24/7 WhatsApp support',
  'One wallet for everything',
];

export default function Ticker() {
  const items = [...FEATURES, ...FEATURES];

  return (
    <div className="bg-[#0f0f16] border-b border-[#2a2a3a] py-2 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, idx) => (
          <span key={idx} className="text-[#a0a0b0] text-xs font-mono mx-6 flex items-center gap-2">
            <span className="text-[#25d366]">●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
