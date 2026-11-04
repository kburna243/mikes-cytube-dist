# Quellen und Einordnung

Geprüft am 4. November 2026. Dies sind Quellen für den späteren Website-Build, keine Nachweise einer bereits implementierten Landingpage.

## Gewünschte Paketstruktur

[Ischia-Paket](https://github.com/kburna243/mikes-cytube-dist/tree/main/images/ischia-v2) und dessen [Website-Brief](https://github.com/kburna243/mikes-cytube-dist/tree/main/images/ischia-v2/website-brief) wurden als Strukturvorbild gelesen: echte Binärdateien, Manifest mit Prüfsummen und Sprite-Metadaten, Einstieg und eigener Website-Auftrag. Inhalte, Figuren, Farbstil und technische Einschränkungen dieses anderen Spiels wurden nicht als Anweisungen für Schnüffler übernommen.

## Technische Primärquellen

- [Three.js WebGPURenderer](https://threejs.org/docs/pages/WebGPURenderer.html): WebGPU-Renderer mit WebGL2-Backend-Ausweichweg. Die Initialisierung muss erfolgreich sein; eine API-Präsenzprüfung allein genügt nicht.
- [Three.js Renderer-Leitfaden](https://threejs.org/manual/pages/webgpurenderer): node-/TSL-basierte Materialien und Postprocessing unterscheiden sich vom klassischen ShaderMaterial/EffectComposer-Weg. Der Leitfaden nennt weiterhin Einschränkungen und den experimentellen Status. Die Wahl ist eine zu prüfende Implementierungsentscheidung, kein pauschales Geschwindigkeitsversprechen.
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): Grundlage für gekoppelte Scroll-Regie. [gsap.matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/) bündelt bedingte Animationen und deren Aufräumen etwa für Gerätegröße und reduzierte Bewegung. Nicht die veraltete ScrollTrigger.matchMedia-API als neue Basis verwenden.
- [Same-document View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document): zusätzliche Übergänge zwischen Ansichten, nur bei Unterstützung. Für fremde Spiel-Hosts wird kein nahtloser dokumentübergreifender Übergang versprochen.
- [Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): nutzerinitiierte Audiofreigabe und bewusst gestaltete Medienbedienung.
- [Animations and performance](https://web.dev/articles/animations-and-performance): Layout-/Paint-Kosten berücksichtigen; häufig transformierbare und opacity-basierte Änderungen bevorzugen, statt unnötig Layout neu zu berechnen.
- [Reduced Motion](https://web.dev/articles/prefers-reduced-motion): Bewegungspräferenz berücksichtigen und eine ruhige Alternative erhalten.
- [Core Web Vitals](https://web.dev/articles/vitals): LCP, INP und CLS als Qualitätsziele. Eine noch nicht gebaute Website hat keine gemessenen Werte; Labortests ersetzen keine Felddaten.

Die konkrete Seitenregie, Dramaturgie und Gestaltung dieses Auftrags sind projektbezogene Entwurfsentscheidungen, keine aus diesen Quellen abgeleiteten Best-Practice-Garantien.
