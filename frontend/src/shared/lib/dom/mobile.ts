export const isMobileDevice = /* @__PURE__ */ () =>
    /(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);

export const isIOS = /* @__PURE__ */ () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const isTelegramWebView = /* @__PURE__ */ () => {
    return (
        typeof (window as any).TelegramWebview !== 'undefined' || // Android
        typeof (window as any).TelegramWebviewProxy !== 'undefined' || // iOS
        typeof (window as any).TelegramWebviewProxyProto !== 'undefined' // iOS (иногда)
    );
};
