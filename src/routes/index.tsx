import { createSignal, Show, lazy, For, createEffect } from "solid-js";
import { isServer } from "solid-js/web";
import Drawer from "../components/Drawer";
import resumeData from "../config/resume.json";

const GoogleMap = lazy(() => import("../components/GoogleMap"));

export default function Index() {
  const [leftDrawerOpen, setLeftDrawerOpen] = createSignal(false);
  const [rightDrawerOpen, setRightDrawerOpen] = createSignal(false);
  const [showMap, setShowMap] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);
  const [selectedJob, setSelectedJob] = createSignal<string | null>(null);
  const [showJobDetails, setShowJobDetails] = createSignal(false);
  const [isTransitioning, setIsTransitioning] = createSignal(false);
  const [jobToShow, setJobToShow] = createSignal<string | null>(null);

  const handleResumeClick = (e: MouseEvent, position: "left" | "right") => {
    if (isServer) return;

    queueMicrotask(() => {
      setHasAnimated(true);

      if (position === "left") {
        setLeftDrawerOpen(true);
      } else {
        setRightDrawerOpen(true);
      }

      setTimeout(() => {
        setShowMap(true);
      }, 50);
    });
  };

  const closeDrawer = (position: "left" | "right") => {
    if (isServer) return;

    if (position === "left") {
      setLeftDrawerOpen(false);
    } else {
      setRightDrawerOpen(false);
    }

    if (!leftDrawerOpen() && !rightDrawerOpen()) {
      setTimeout(() => {
        setShowMap(false);
        setSelectedJob(null);
      }, 300);
    }
  };

  const handleJobSelect = (jobKey: string) => {
    if (isServer) return;

    if (showJobDetails() && !isTransitioning()) {
      if (selectedJob() === jobKey) {
        setShowJobDetails(false);
      } else {
        setIsTransitioning(true);
        setShowJobDetails(false);

        setTimeout(() => {
          setSelectedJob(jobKey);
          setJobToShow(jobKey);
          setShowJobDetails(true);
          setIsTransitioning(false);
        }, 400);
      }
    } else {
      setSelectedJob(jobKey);
      setJobToShow(jobKey);
      setShowJobDetails(true);
    }
  };

  createEffect(() => {
    if (!rightDrawerOpen()) {
      setShowJobDetails(false);
    } else {
      setSelectedJob(Object.keys(resumeData)[0]);
      setJobToShow(Object.keys(resumeData)[0]);
      setShowJobDetails(true);
    }
  });

  const selectedJobData = () => {
    const key = jobToShow();
    if (!key) return null;
    return resumeData[key as keyof typeof resumeData];
  };

  return (
    <div class="h-screen w-screen flex bg-gradient-to-br from-green-950/10 to-green-900/10 relative overflow-hidden">
      <div class="absolute inset-0 z-0">
        <Show when={!isServer && showMap()}>
          <div class="w-full h-full map-fade-in">
            <GoogleMap />
          </div>
        </Show>
      </div>
      <div class="absolute inset-0 z-[5] pointer-events-none bg-green-950/80" />
      <div
        class="main-content relative z-10 flex flex-col items-center justify-center w-full max-w-2xl p-8 mx-auto text-center"
        classList={{
          "content-fade-out pointer-events-none": showMap() && hasAnimated(),
          "content-fade-in": !showMap() && hasAnimated(),
        }}
      >
        <h3 class="text-5xl mb-8 text-yellow-100 font-playwrite [text-shadow:0_2px_4px_rgba(0,0,0,0.9)]">
          Hello, I'm Doug.
        </h3>
        <p class="text-lg font-lato">I am a software engineer and manager.</p>
        <p class="text-lg mb-3 font-lato">
          I made this site with SolidStart, the Google Maps API, and Tailwind.<sup>*</sup>
        </p>
        {/* <p class="text-xs mb-6 font-lato">
          I'm also writing a service in Go that I haven't put up yet that geolocates your IP address, puts you on the
          map, and shows you the 0-2 other people looking at this site through a websocket.
        </p> */}
        <div class="flex gap-4 flex-col">
          <button
            onClick={(e) => handleResumeClick(e, "right")}
            class="btn-shimmer px-8 py-3 text-lg bg-[#0077c2] text-white rounded cursor-pointer relative 
                before:absolute before:inset-0 before:border-2 before:border-slate-400 before:opacity-0 
                before:scale-[1.15] hover:before:scale-100 hover:before:opacity-100 
                before:transition-all before:duration-300 before:ease-out before:rounded font-playwrite font-bold mb-5"
          >
            Résumé
          </button>
        </div>
        <p class="text-xs mb-6 font-lato">
          <sup>*</sup>All the animations and tough parts are pure CSS
        </p>
      </div>

      <div
        class="fixed left-0 top-1/8 z-20 max-w-md w-full transform transition-transform duration-400 ease-out-back pointer-events-none"
        classList={{
          "translate-x-0": showJobDetails(),
          "-translate-x-full": !showJobDetails(),
        }}
      >
        <Show when={selectedJobData()}>
          <div class="ml-6 mr-4 shadow-lg relative pointer-events-auto animate-fadeIn">
            <div
              class="relative z-10 bg-neutral-900/95 rounded-md p-5 
                     border-2 border-[#00ff80]/60 
                     shadow-[0_0_10px_rgba(0,255,128,0.3),0_0_20px_rgba(0,255,128,0.2)] 
                     transition-all duration-300 hover:shadow-[0_0_12px_rgba(0,255,128,0.4),0_0_24px_rgba(0,255,128,0.3)]"
            >
              <h3 class="text-xl font-playwrite text-white mb-2">{selectedJobData()?.name}</h3>
              {selectedJobData()?.subname && (
                <h4 class="text-lg font-playwrite text-white mb-2">{selectedJobData()?.subname}</h4>
              )}
              <div
                class="inline-block bg-[#1a1a1a] border border-[#00ff80]/60 px-3 py-1 rounded mb-4
                  font-lato text-sm text-[#00ff80] font-medium tracking-wide"
              >
                {selectedJobData()?.years}
              </div>
              <p class="text-white/80 font-lato text-sm leading-relaxed job-description-panel">
                {selectedJobData()?.description}
              </p>

              <button
                class="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
                onClick={() => setShowJobDetails(false)}
              >
                ✕
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* <Show when={leftDrawerOpen()}>
        <Drawer position="left" isOpen={leftDrawerOpen()} onClose={() => closeDrawer("left")}>
          <h2 class="text-white font-roboto text-2xl">Left Drawer Content</h2>
          <p class="mt-4">This is the left drawer content.</p>
        </Drawer>
      </Show> */}

      <Show when={rightDrawerOpen()}>
        <Drawer position="right" isOpen={rightDrawerOpen()} onClose={() => closeDrawer("right")}>
          <h2 class="text-white font-playwrite text-2xl font-bold mb-8">L'histoire</h2>

          <div class="space-y-10 relative">
            <For each={Object.entries(resumeData)}>
              {([key, item]) => (
                <div
                  class="relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,128,0.2)] group"
                  classList={{
                    "shadow-[0_0_20px_rgba(0,255,128,0.3)]": selectedJob() === key,
                  }}
                  onClick={() => handleJobSelect(key)}
                >
                  <div class="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden">
                    <img
                      src={`/logos/${item.logo}`}
                      alt={`${item.name} logo`}
                      class="w-auto h-auto max-w-[80%] max-h-[80%] object-contain opacity-20 transition-opacity duration-300 pr-4 drop-shadow-[0_35px_35px_rgba(255,255,255,0.5)]"
                      classList={{
                        "opacity-40": selectedJob() === key,
                      }}
                    />
                  </div>
                  <div class="relative z-10 p-4">
                    <h3 class="text-xl font-arsenal text-white mb-2 bold">{item.name}</h3>

                    <div
                      class="inline-block bg-[#1a1a1a] px-3 py-1 rounded
                        font-lato text-sm text-[#00ff80] font-medium tracking-wide
                        group-hover:bg-[#00ff80]/10 transition-all duration-300
                        shadow-[0_0_10px_rgba(0,255,128,0.1)]"
                      classList={{
                        "bg-[#00ff80]/20 border-[#00ff80]/70 shadow-[0_0_15px_rgba(0,255,128,0.2)]":
                          selectedJob() === key,
                      }}
                    >
                      {item.years}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Drawer>
      </Show>
    </div>
  );
}
