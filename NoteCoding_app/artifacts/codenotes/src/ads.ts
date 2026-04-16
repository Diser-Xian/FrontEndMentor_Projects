export const ads = {
  initialized: false,

  loadAds(): void {
    this.initialized = true;
  },

  showBanner(_containerId: string): void {
  },

  showInterstitial(_onClose?: () => void): void {
    if (_onClose) setTimeout(_onClose, 100);
  },
};
