import type {ExternalEventHandler} from "@/domain/usecase/uiHandler/external"

declare global {
  interface Window {
    notebox: ExternalEventHandler;
    find: (
      aString: string,
      aCaseSensitive: boolean,
      aBackwards: boolean,
      aWrapAround: boolean,
      aWholeWord: boolean,
      aSearchInFrames: boolean,
      aShowDialog: boolean
    ) => boolean;
    Selection: typeof Selection["constructor"];
    DataTransfer: typeof DataTransfer["constructor"];
    Node: typeof Node["constructor"];
  }

  type NBExternalMessageHandler = {
    id?: string;
    nbError: (message: string) => void;
    nbConnected: (bool: boolean) => void;
    nbInitiated: (bool: boolean) => void;
    nbSelected: (json: string) => void;
    nbContribute: (json: string) => void;
    nbNavigate: (url: string) => void;
    nbUploadFile: (json: string) => void;
    nbHaptic: (bool: boolean) => void;
    nbDraggingStartByTouch: (bool: boolean) => void;
    nbDraggingEndByTouch: (bool: boolean) => void;
    nbSearchMode: (bool: boolean) => void;
    nbOpenFile: (json: string) => void;
  };
}
