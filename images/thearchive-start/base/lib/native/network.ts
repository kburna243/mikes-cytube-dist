import { IS_NATIVE } from "../platform";

export type ConnectionStatus = "online" | "offline" | "unknown";

let currentStatus: ConnectionStatus = "unknown";

export function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export function onNetworkChange(
  callback: (status: ConnectionStatus) => void,
): () => void {
  if (!IS_NATIVE) {
    // Web fallback
    const handleOnline = () => {
      currentStatus = "online";
      callback("online");
    };
    const handleOffline = () => {
      currentStatus = "offline";
      callback("offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    currentStatus = navigator.onLine ? "online" : "offline";
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }

  // Capacitor native listener
  let cleanup: (() => void) | null = null;
  import("@capacitor/network").then(({ Network }) => {
    Network.getStatus().then((status) => {
      currentStatus = status.connected ? "online" : "offline";
      callback(currentStatus);
    });
    Network.addListener("networkStatusChange", (status) => {
      currentStatus = status.connected ? "online" : "offline";
      callback(currentStatus);
    }).then((handle) => {
      cleanup = () => handle.remove();
    });
  });

  return () => {
    cleanup?.();
  };
}
