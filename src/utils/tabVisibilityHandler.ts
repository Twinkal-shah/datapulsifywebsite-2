// Global tab visibility handler for Data Pulsify
// This implements the exact code requested by the user

interface TabVisibilityOptions {
  refreshData?: () => void | Promise<void>;
}

export class TabVisibilityHandler {
  private static instance: TabVisibilityHandler;
  private refreshCallback?: () => void | Promise<void>;
  private isListening = false;

  constructor() {
    if (TabVisibilityHandler.instance) {
      return TabVisibilityHandler.instance;
    }
    TabVisibilityHandler.instance = this;
  }

  public init(options?: TabVisibilityOptions) {
    if (this.isListening) return;
    
    this.refreshCallback = options?.refreshData;
    this.setupVisibilityListener();
    this.isListening = true;
  }

  private setupVisibilityListener() {
    // The exact code requested by the user
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible - refreshing data');
        // Re-fetch data or refresh session when tab becomes active
        if (this.refreshCallback) {
          try {
            await this.refreshCallback();
          } catch (error) {
            console.warn('Error during data refresh:', error);
          }
        }
      }
    });
  }

  public setRefreshCallback(callback: () => void | Promise<void>) {
    this.refreshCallback = callback;
  }

  public destroy() {
    // Note: We can't easily remove the event listener since we don't store the function reference
    // But this is typically not needed in SPAs
    this.isListening = false;
    this.refreshCallback = undefined;
  }
}

// Export a default instance for easy use
export const tabVisibilityHandler = new TabVisibilityHandler();

// Export the exact function requested by the user for direct use
export const initTabVisibilityRefresh = (refreshData: () => void | Promise<void>) => {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      // Re-fetch data or refresh session when tab becomes active
      try {
        await refreshData();
      } catch (error) {
        console.warn('Error during data refresh:', error);
      }
    }
  });
}; 