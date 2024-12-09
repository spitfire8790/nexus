// Create a new file: src/lib/api-throttle.ts
class ApiThrottle {
    private static instance: ApiThrottle;
    private queue: Array<() => Promise<any>> = [];
    private isProcessing = false;
  
    private constructor() {}
  
    public static getInstance(): ApiThrottle {
      if (!ApiThrottle.instance) {
        ApiThrottle.instance = new ApiThrottle();
      }
      return ApiThrottle.instance;
    }
  
    private async processQueue() {
      if (this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }
  
      this.isProcessing = true;
      const request = this.queue.shift();
      if (request) {
        await request();
        // Add a delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        this.processQueue();
      }
    }
  
    public async fetch(url: string, options?: RequestInit): Promise<Response> {
      const executeRequest = async (): Promise<Response> => {
        try {
          const response = await fetch(url, options);
          if (response.status === 429) {
            console.log('Rate limit hit, waiting 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return this.fetch(url, options);
          }
          return response;
        } catch (error) {
          throw error;
        }
      };
  
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result = await executeRequest();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
  
        if (!this.isProcessing) {
          this.processQueue();
        }
      });
    }
  }
  
  export const apiThrottle = ApiThrottle.getInstance();