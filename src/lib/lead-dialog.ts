import { create } from "zustand";

type LeadContext = {
  productId?: string | null;
  productTitle?: string | null;
  source?: string;
};

type State = {
  open: boolean;
  context: LeadContext;
  openDialog: (ctx?: LeadContext) => void;
  close: () => void;
};

export const useLeadDialog = create<State>((set) => ({
  open: false,
  context: {},
  openDialog: (ctx = {}) => set({ open: true, context: ctx }),
  close: () => set({ open: false }),
}));