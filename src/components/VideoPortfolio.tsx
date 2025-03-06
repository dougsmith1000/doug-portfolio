import { createSignal, For } from "solid-js";
import VideoModal from "./VideoModal";

interface VideoProject {
  id: string;
  title: string;
  description: string;
  videoSrc: string;
  technologies: string[];
  role: string;
}

export default function VideoPortfolio() {
  const [activeModalVideo, setActiveModalVideo] = createSignal<string | null>(null);
  const [activeModalTitle, setActiveModalTitle] = createSignal<string>("");

  const portfolioItems: VideoProject[] = [
    {
      id: "rallyhere",
      title: "RallyHere Developer Portal",
      description: "A developer portal for game studios to manage their game servers and services.",
      videoSrc: "/videos/optimized/rh-trim-optimized.mp4",
      technologies: [
        "React",
        "TypeScript",
        "FastAPI",
        "OpenAPI",
        "Tanstack Query",
        "Tanstack Table",
        "Tailwind",
        "OAuth",
        "RBAC",
      ],
      role: "Frontend Lead",
    },
    {
      id: "dko",
      title: "Divine Knockout",
      description: "Website for a third-person platform fighter featuring gods from various mythologies.",
      videoSrc: "/videos/optimized/dko-trim-optimized.mp4",
      technologies: ["Next.js", "Tailwind", "Strapi", "Cloudflare API"],
      role: "Director of Web Development",
    },
    {
      id: "smite2",
      title: "SMITE 2",
      description: "Website for the sequel to the popular third-person MOBA featuring gods from various mythologies.",
      videoSrc: "/videos/optimized/smite2-optimized.mp4",
      technologies: ["Next.js", "Tailwind", "Strapi", "Cloudflare API"],
      role: "Director of Web Development",
    },
  ];

  const handleVideoClick = (item: VideoProject) => {
    setActiveModalVideo(item.videoSrc);
    setActiveModalTitle(item.title);
  };

  const closeModal = () => {
    setActiveModalVideo(null);
  };

  return (
    <div class="px-4 video-container">
      <div class="space-y-8">
        <For each={portfolioItems}>
          {(item) => (
            <div class="video-item bg-neutral-800/50 rounded-lg overflow-hidden shadow-lg">
              <div class="video-thumbnail relative cursor-pointer" onClick={() => handleVideoClick(item)}>
                <video
                  src={item.videoSrc}
                  autoplay
                  loop
                  muted
                  playsinline
                  class="w-full h-auto"
                  onError={(e) => console.error("Video error:", e)}
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div class="play-button w-10 h-10 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="video-content p-4">
                <h3 class="video-title text-xl font-bold text-white/90 mb-2">{item.title}</h3>
                <p class="video-description text-white/70 mb-3">{item.description}</p>

                <div class="mb-3">
                  <span class="video-label text-white/90 font-semibold">Role:</span>
                  <span class="video-text text-white/70 ml-2">{item.role}</span>
                </div>

                <div>
                  <span class="video-label text-white/90 font-semibold">Technologies:</span>
                  <div class="flex flex-wrap gap-2 mt-2">
                    <For each={item.technologies}>
                      {(tech) => (
                        <span class="video-tech px-2 py-1 bg-neutral-700/50 rounded-md text-xs text-white/80">
                          {tech}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>

      {activeModalVideo() !== null && (
        <VideoModal
          videoSrc={activeModalVideo() || ""}
          isOpen={activeModalVideo() !== null}
          onClose={closeModal}
          title={activeModalTitle()}
        />
      )}
    </div>
  );
}
