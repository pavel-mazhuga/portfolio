export default function loadScript(url: string) {
    return new Promise((resolve, reject) => {
        if (!(window as any).loadedScripts) {
            (window as any).loadedScripts = {};
        }

        if ((window as any).loadedScripts[url]) {
            resolve((window as any).loadedScripts[url]);
        }

        const script = document.createElement('script');

        script.onerror = (err) => {
            (window as any).loadedScripts[url] = false;
            reject(err);
        };

        script.onload = () => {
            (window as any).loadedScripts[url] = true;
            resolve(script);
        };

        script.async = true;
        script.src = url;

        const head = document.head || document.getElementsByTagName('head')[0];
        head.appendChild(script);
    });
}
