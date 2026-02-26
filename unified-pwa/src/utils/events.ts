// Simple event system for cross-component communication
type EventType = 'PROFILE_UPDATED' | 'THEME_CHANGED';

class EventManager {
  private static instance: EventManager;
  private listeners: Map<EventType, Set<() => void>> = new Map();

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  subscribe(event: EventType, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  unsubscribe(event: EventType, callback: () => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: EventType) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
}

export { EventManager, EventType };
