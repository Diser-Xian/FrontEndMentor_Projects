const PREMIUM_KEY = "codenotes_premium";

export const payment = {
  isPremium(): boolean {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  },

  async purchase(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(PREMIUM_KEY, "true");
        resolve(true);
      }, 800);
    });
  },

  restore(): boolean {
    const val = localStorage.getItem(PREMIUM_KEY);
    return val === "true";
  },

  revoke(): void {
    localStorage.removeItem(PREMIUM_KEY);
  },

  PREMIUM_FEATURES: [
    "Unlimited notes",
    "Advanced syntax highlighting",
    "Export to PDF",
    "Cloud sync (coming soon)",
    "Priority support",
  ],
};
