import { TypedEmitter } from './eventBus';
import type { BusEvents } from './types';

/** Barramento único da aplicação. */
export const bus = new TypedEmitter<BusEvents>();
