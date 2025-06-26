class NavigationOptimizer {
  private static instance: NavigationOptimizer;
  private lastTabSwitch: number = 0;
  private isOptimizing: boolean = false;

  static getInstance(): NavigationOptimizer {
    if (!NavigationOptimizer.instance) {
      NavigationOptimizer.instance = new NavigationOptimizer();
    }
    return NavigationOptimizer.instance;
  }

  private constructor() {
    this.setupTabVisibilityTracking();
  }

  private setupTabVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastTabSwitch = Date.now();
        this.optimizeForNavigation();
      }
    });
  }

  private optimizeForNavigation() {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    console.log('Navigation optimizer: Preparing for fast navigation after tab switch');

    // Preload critical resources
    setTimeout(() => {
      this.preloadCriticalResources();
    }, 100);

    // Reset optimization flag after a delay
    setTimeout(() => {
      this.isOptimizing = false;
    }, 10000); // 10 seconds
  }

  private async preloadCriticalResources() {
    try {
      // Preload main navigation components
      const componentPromises = [
        import('../pages/RankTracker'),
        import('../pages/Settings'),
        import('../pages/ClickGapIntelligence'),
        import('../pages/CustomAIDashboard'),
      ];

      await Promise.allSettled(componentPromises);
      console.log('Navigation optimizer: Critical components preloaded');
    } catch (error) {
      console.warn('Navigation optimizer: Failed to preload components:', error);
    }
  }

  isRecentTabSwitch(): boolean {
    return Date.now() - this.lastTabSwitch < 5000; // 5 seconds
  }

  shouldOptimizeLoading(): boolean {
    return this.isRecentTabSwitch() && this.isOptimizing;
  }
}

export const navigationOptimizer = NavigationOptimizer.getInstance(); 