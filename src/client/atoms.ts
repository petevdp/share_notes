import { atom } from "recoil";
import { ConvergenceDomain, RealTimeModel } from "@convergence/convergence";

export const domainState = atom({
  key: "domain",
  default: null as ConvergenceDomain | null,
});

export const roomIdState = atom({
  key: "roomId",
  default: null as null | string,
});

type roomEditorStatus = "active";

export const roomEditorStatusesState = atom({
  key: "roomEditorStatuses",
  default: {} as { [key: string]: string },
});

export const editorAdaptersState = atom({
  key: "roomEditorModels",
  default: {} as { [key: string]: string },
});

export const roomModelState = atom({
  key: "roomModel",
  default: null as RealTimeModel | null,
});
