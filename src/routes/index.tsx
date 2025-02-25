import { createSignal, Show, lazy } from "solid-js";
import { isServer } from "solid-js/web";
import Drawer from "../components/Drawer";

// Lazy load the GoogleMap component to ensure it's only loaded on the client side
const GoogleMap = lazy(() => import("../components/GoogleMap"));

export default function Index() {
  const [leftDrawerOpen, setLeftDrawerOpen] = createSignal(false);
  const [rightDrawerOpen, setRightDrawerOpen] = createSignal(false);
  const [showMap, setShowMap] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);

  const handleResumeClick = (e: MouseEvent, position: "left" | "right") => {
    // Server guard - needed to prevent any browser code from running during SSR
    if (isServer) return;

    // Performance optimization - use a microtask to ensure smooth animation sequencing
    queueMicrotask(() => {
      // First mark that animations have started
      setHasAnimated(true);

      // Open drawer immediately - we'll let its animation handle timing
      if (position === "left") {
        setLeftDrawerOpen(true);
      } else {
        setRightDrawerOpen(true);
      }

      // Set a small delay before starting map show - gives drawer time to start opening
      setTimeout(() => {
        setShowMap(true);
      }, 50);
    });
  };

  const closeDrawer = (position: "left" | "right") => {
    // Server guard
    if (isServer) return;

    if (position === "left") {
      setLeftDrawerOpen(false);
    } else {
      setRightDrawerOpen(false);
    }

    // Only hide map if both drawers are closed
    if (!leftDrawerOpen() && !rightDrawerOpen()) {
      setTimeout(() => {
        setShowMap(false);
      }, 300);
    }
  };

  return (
    <div class="h-screen w-screen flex bg-gradient-to-br from-green-950/10 to-green-900/10 relative overflow-hidden">
      {/* Map container - with a dark background to prevent flash */}
      <div class="absolute inset-0 z-0 bg-[#1a1a1a]">
        <Show when={!isServer && showMap()}>
          <div class="w-full h-full map-fade-in">
            <GoogleMap />
          </div>
        </Show>
      </div>

      {/* Green Overlay */}
      <div class="absolute inset-0 z-[5] pointer-events-none bg-green-950/80" />

      {/* Main Content */}
      <div
        class="main-content relative z-10 flex flex-col items-center justify-center w-full p-8"
        classList={{
          "content-fade-out": showMap() && hasAnimated(),
          "content-fade-in": !showMap() && hasAnimated(),
        }}
      >
        <h3 class="text-5xl mb-8 text-yellow-100 font-playwrite [text-shadow:0_2px_4px_rgba(0,0,0,0.9)]">
          Hello, I'm Doug.
        </h3>
        <p class="text-lg mb-1 font-lato">I am a software engineer and manager.</p>
        <p class="text-lg mb-5 font-lato">
          I made this site with SolidStart, the Google Maps API, and Tailwind{" "}
          <span class="text-sm font-lato">(all the animations and tough parts were real CSS)</span>.
        </p>

        <div class="flex gap-4 flex-col">
          <button
            onClick={(e) => handleResumeClick(e, "right")}
            class="btn-shimmer px-8 py-3 text-lg bg-[#0077c2] text-white rounded cursor-pointer relative 
                before:absolute before:inset-0 before:border-2 before:border-slate-400 before:opacity-0 
                before:scale-[1.15] hover:before:scale-100 hover:before:opacity-100 
                before:transition-all before:duration-300 before:ease-out before:rounded font-playwrite font-bold"
          >
            Résumé
          </button>
        </div>
      </div>

      <Show when={leftDrawerOpen()}>
        <Drawer position="left" isOpen={leftDrawerOpen()} onClose={() => closeDrawer("left")}>
          <h2 class="text-white font-roboto text-2xl">Left Drawer Content</h2>
          <p class="mt-4">This is the left drawer content.</p>
        </Drawer>
      </Show>

      <Show when={rightDrawerOpen()}>
        <Drawer position="right" isOpen={rightDrawerOpen()} onClose={() => closeDrawer("right")}>
          <h2 class="text-white font-roboto text-2xl">Resume</h2>
          <p class="mt-4">Resume content goes here.</p>
        </Drawer>
      </Show>
    </div>
  );
}
