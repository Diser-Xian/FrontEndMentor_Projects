import { useState } from "react";
import { X, Star, Check, Loader2 } from "lucide-react";
import { payment } from "@/payment";

interface PremiumModalProps {
  onClose: () => void;
  onPurchase: () => void;
}

export function PremiumModal({ onClose, onPurchase }: PremiumModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const ok = await payment.purchase();
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          onPurchase();
          onClose();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-foreground">CodeNotes Premium</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-close-premium-modal">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-green-400" />
              </div>
              <p className="text-foreground font-medium text-sm">Premium unlocked!</p>
              <p className="text-muted-foreground text-xs mt-1">Enjoy your premium features.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">Unlock the full potential of CodeNotes.</p>
              <ul className="space-y-2 mb-5">
                {payment.PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-foreground">
                    <Check size={12} className="text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                data-testid="button-purchase-premium"
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Processing...</>
                ) : (
                  <><Star size={14} /> Upgrade to Premium</>
                )}
              </button>
              <p className="text-center text-[10px] text-muted-foreground mt-2">Mock purchase — no real charge</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
