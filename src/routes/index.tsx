import { createSignal, Show, lazy, For, createEffect, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import Drawer from "~/components/Drawer";
import resumeData from "~/config/resume.json";

const GoogleMap = lazy(() => import("~/components/GoogleMap"));

export default function Index() {
  const [leftDrawerOpen, setLeftDrawerOpen] = createSignal(false);
  const [rightDrawerOpen, setRightDrawerOpen] = createSignal(false);
  const [showMap, setShowMap] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);
  const [selectedJob, setSelectedJob] = createSignal<string | null>(null);
  const [showJobDetails, setShowJobDetails] = createSignal(false);
  const [isTransitioning, setIsTransitioning] = createSignal(false);
  const [jobToShow, setJobToShow] = createSignal<string | null>(null);
  const [showCityImage, setShowCityImage] = createSignal(false);
  const [isMobile, setIsMobile] = createSignal(false);
  const [drawerCollapsed, setDrawerCollapsed] = createSignal(false);

  onMount(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  });

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

      if (isMobile()) {
        setTimeout(() => {
          const firstJobKey = Object.keys(resumeData)[0];
          setSelectedJob(firstJobKey);
          setJobToShow(firstJobKey);
          setShowJobDetails(true);

          setTimeout(() => {
            setShowCityImage(true);
            setDrawerCollapsed(true);
          }, 300);
        }, 800);
      }
    });
  };

  const closeDrawer = (position: "left" | "right") => {
    if (isServer) return;

    if (position === "left") {
      setLeftDrawerOpen(false);
    } else {
      setRightDrawerOpen(false);
      setDrawerCollapsed(false);
    }

    if (!leftDrawerOpen() && !rightDrawerOpen()) {
      setTimeout(() => {
        setShowMap(false);
        setSelectedJob(null);
        setShowCityImage(false);
      }, 300);
    }
  };

  const expandDrawer = () => {
    setDrawerCollapsed(false);
  };

  const handleJobSelect = (jobKey: string) => {
    if (isServer) return;

    setShowCityImage(false);

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

          setTimeout(() => {
            setShowCityImage(true);
          }, 200);
        }, 400);
      }
    } else {
      setSelectedJob(jobKey);
      setJobToShow(jobKey);
      setShowJobDetails(true);

      setTimeout(() => {
        setShowCityImage(true);
      }, 200);
    }

    if (isMobile() && rightDrawerOpen()) {
      setTimeout(() => {
        setDrawerCollapsed(true);
      }, 300);
    }
  };

  createEffect(() => {
    if (!rightDrawerOpen()) {
      setShowJobDetails(false);
      setShowCityImage(false);
      setDrawerCollapsed(false);
    } else {
      const firstJobKey = Object.keys(resumeData)[0];
      setSelectedJob(firstJobKey);
      setJobToShow(firstJobKey);
      setShowJobDetails(true);

      setTimeout(() => {
        setShowCityImage(true);
        if (isMobile()) {
          setTimeout(() => {
            setDrawerCollapsed(true);
          }, 500);
        }
      }, 300);
    }
  });

  const selectedJobData = () => {
    const key = jobToShow();
    if (!key) return null;
    return resumeData[key as keyof typeof resumeData];
  };

  const selectedJobCoordinates = () => {
    const data = selectedJobData();
    if (!data) return null;
    return { lat: data.lat, lng: data.lng };
  };

  const navigateToNextJob = () => {
    const jobKeys = Object.keys(resumeData);
    const currentIndex = jobKeys.findIndex((key) => key === selectedJob());

    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + jobKeys.length) % jobKeys.length;
      handleJobSelect(jobKeys[prevIndex]);
    }
  };

  const navigateToPreviousJob = () => {
    const jobKeys = Object.keys(resumeData);
    const currentIndex = jobKeys.findIndex((key) => key === selectedJob());

    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % jobKeys.length;
      handleJobSelect(jobKeys[nextIndex]);
    }
  };

  return (
    <div class="h-screen w-screen flex bg-gradient-to-br from-green-950/10 to-green-900/10 relative overflow-hidden">
      <div class="absolute inset-0 z-0">
        <Show when={!isServer && showMap()}>
          <div class="w-full h-full map-fade-in">
            <GoogleMap markerPosition={selectedJobCoordinates} />
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
        <div class="flex gap-4 flex-col">
          <button
            onClick={(e) => handleResumeClick(e, "right")}
            class="btn-shimmer px-8 py-3 text-lg bg-[#0077c2] text-white rounded cursor-pointer relative 
                before:absolute before:inset-0 before:border-2 before:border-slate-400 before:opacity-0 
                before:scale-[1.15] hover:before:scale-100 hover:before:opacity-100 
                before:transition-all before:duration-300 before:ease-out before:rounded font-playwrite font-bold mb-7"
          >
            Résumé
          </button>
        </div>
        <div class="group relative mb-6 cursor-pointer self-start mx-auto w-full">
          <p class="text-lg font-lato border-b border-[#00ff80]/40 inline-block transition-all duration-300 group-hover:border-[#00ff80] group-hover:text-[#00ff80]/90">
            I am a software engineer and manager.
          </p>
          <div class="absolute left-0 right-0 grid grid-rows-[1fr] group-hover:grid-rows-[1fr] transition-all duration-500 mt-0 group-hover:mt-3 text-center max-auto">
            <div class="overflow-hidden">
              <div class="text-sm font-lato text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 mx-auto text-center max-w-[500px]">
                <p class="mb-2">
                  For those of you who like industry words, I'm a versatile technology leader with experience in front
                  and back-end web development, project management, and team leadership.
                </p>
                <p class="mb-2">
                  I’ve managed development teams, streamlined marketing processes, and led engineering efforts, most
                  recently serving as the UX and Development Lead for a Developer Portal at a startup focused on live
                  service and multiplayer game backends.
                </p>
                <p class="mb-2">
                  I'm looking for opportunities where I can leverage my blend of technical expertise and strategic
                  oversight to drive digital solutions, optimize workflows, and lead cross-functional teams. If that
                  sounds like something you’re interested in, email me or take a look at my resume.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* <p class="text-xs mb-6 font-lato">
          I'm also writing a service in Go that I haven't put up yet that geolocates your IP address, puts you on the
          map, and shows you the 0-2 other people looking at this site through a websocket.
        </p> */}
      </div>

      <div
        class="fixed left-[150px] bottom-0 z-20 mx-auto max-w-md w-full transform pointer-events-none select-none transition-opacity"
        style="padding: 100px; margin: -100px;"
        classList={{
          "opacity-100": showCityImage(),
          "opacity-0": !showCityImage(),
          "left-[50px]": isMobile(),
        }}
      >
        <Show when={selectedJobData()?.cityImage}>
          <div
            class="relative pointer-events-auto"
            style="transform-origin: bottom left; overflow: visible;"
            classList={{
              "animate-rotateIn": showCityImage(),
            }}
          >
            <div class="relative z-10 bg-transparent text-center">
              <img
                src={`/cities/${selectedJobData()?.cityImage}`}
                alt={`${selectedJobData()?.name} location`}
                class="max-w-[600px] select-none rounded-md w-[26vw]"
                classList={{
                  "city-image-mobile": isMobile(),
                }}
              />
            </div>
          </div>
        </Show>
      </div>

      <div
        class="fixed left-0 top-1/8 z-20 max-w-md w-full transform transition-transform duration-400 ease-out-back pointer-events-none select-none"
        classList={{
          "translate-x-0": showJobDetails(),
          "-translate-x-full": !showJobDetails(),
        }}
      >
        <Show when={selectedJobData()}>
          <div class="ml-6 mr-4 shadow-lg relative pointer-events-auto animate-fadeIn">
            <div
              class="relative z-10 bg-neutral-900/80 rounded-md p-5 
                     border-2 border-[#00ff80]/60 
                     shadow-[0_0_10px_rgba(0,255,128,0.3),0_0_20px_rgba(0,255,128,0.2)] 
                     transition-all duration-300 hover:shadow-[0_0_12px_rgba(0,255,128,0.4),0_0_24px_rgba(0,255,128,0.3)]"
            >
              <h3 class="text-xl font-playwrite text-white mb-2">{selectedJobData()?.name}</h3>
              {selectedJobData()?.subname && (
                <h4 class="text-sm font-playwrite text-white mb-2">{selectedJobData()?.subname}</h4>
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

              <div class="flex justify-between mt-4">
                <button class="nav-arrow" onClick={navigateToPreviousJob} title="Previous job">
                  ←
                </button>
                <button class="nav-arrow" onClick={navigateToNextJob} title="Next job">
                  →
                </button>
              </div>

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

      <Show when={rightDrawerOpen() && drawerCollapsed() && isMobile()}>
        <div class="drawer-tab" onClick={expandDrawer}>
          <div class="drawer-tab-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </div>
        </div>
      </Show>

      {/* <Show when={leftDrawerOpen()}>
        <Drawer position="left" isOpen={leftDrawerOpen()} onClose={() => closeDrawer("left")}>
          <h2 class="text-white font-roboto text-2xl">Left Drawer Content</h2>
          <p class="mt-4">This is the left drawer content.</p>
        </Drawer>
      </Show> */}

      <Show when={rightDrawerOpen()}>
        <Drawer
          position="right"
          isOpen={rightDrawerOpen()}
          onClose={() => closeDrawer("right")}
          drawerWidth={drawerCollapsed() && isMobile() ? 0 : undefined}
          isCollapsed={drawerCollapsed()}
        >
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
                      class="w-auto h-auto max-w-[40%] min-w-[150px] max-h-[80%] object-contain opacity-20 transition-opacity duration-300 pr-4 drop-shadow-[0_35px_35px_rgba(255,255,255,0.5)]"
                      classList={{
                        "opacity-40": selectedJob() === key,
                        "filter-invert": item.darkLogo,
                      }}
                    />
                  </div>
                  <div class="relative z-10 p-4">
                    <h3 class="text-xl font-arsenal text-white mb-1 bold">{item.name}</h3>
                    {item.subname && <h4 class="text-xs font-playwrite text-white mb-3">{item.subname}</h4>}
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

      <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 flex justify-center gap-6 bg-neutral-900/50 px-4 py-2 rounded-full shadow-lg">
        <a href="mailto:doug.mcghost@gmail.com" class="text-white/70 hover:text-white transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        </a>
        <a
          href="https://github.com/dougsmith1000/doug-portfolio"
          target="_blank"
          rel="noopener noreferrer"
          class="text-white/70 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
            <path d="M9 18c-4.51 2-5-2-7-2"></path>
          </svg>
        </a>
        <a
          href="/DougRabinsmithResume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="text-white/70 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </a>
      </div>
    </div>
  );
}
