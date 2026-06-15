// Registry to track active scraping processes
interface ScrapingProcess {
  id: string;
  location: string;
  category: string;
  shouldStop: boolean;
  createdAt: number;
}

class ScrapingRegistry {
  private processes: Map<string, ScrapingProcess> = new Map();

  createProcess(location: string, category: string): string {
    const id = `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.processes.set(id, {
      id,
      location,
      category,
      shouldStop: false,
      createdAt: Date.now(),
    });
    
    return id;
  }

  stopProcess(id: string): boolean {
    const process = this.processes.get(id);
    if (process) {
      process.shouldStop = true;
      return true;
    }
    return false;
  }

  shouldStop(id: string): boolean {
    const process = this.processes.get(id);
    return process?.shouldStop || false;
  }

  removeProcess(id: string): void {
    this.processes.delete(id);
  }

  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, process] of this.processes.entries()) {
      if (process.createdAt < oneHourAgo) {
        this.processes.delete(id);
      }
    }
  }

  getActiveProcessId(location: string, category: string): string | null {
    for (const [id, process] of this.processes.entries()) {
      if (process.location === location && process.category === category && !process.shouldStop) {
        return id;
      }
    }
    return null;
  }
}

// Singleton instance
const scrapingRegistry = new ScrapingRegistry();

// Cleanup old processes every 5 minutes
setInterval(() => {
  scrapingRegistry.cleanup();
}, 5 * 60 * 1000);

export default scrapingRegistry;
