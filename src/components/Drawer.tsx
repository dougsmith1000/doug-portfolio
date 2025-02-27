import { createSignal, JSX, onCleanup, createEffect, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { Show } from "solid-js";

interface DrawerProps {
  position: "left" | "right";
  isOpen: boolean;
  onClose: () => void;
  children: JSX.Element;
  drawerWidth?: number;
  isCollapsed?: boolean;
}

export default function Drawer(props: DrawerProps) {
  const [drawerWidth, setDrawerWidth] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);
  const [isAnimating, setIsAnimating] = createSignal(false);

  let startX = 0;
  let startWidth = 0;
  let resizeTimeout: number | null = null;
  let animationFrame: number | null = null;
  let animationTimer: number | null = null;

  if (isServer) {
    return (
      <div
        class={`absolute top-0 h-full bg-neutral-900/90 text-white shadow-[0_0_12px_rgba(0,0,0,0.3)] z-20 ${
          props.position === "left" ? "left-0" : "right-0"
        }`}
        style={{ width: "0px" }}
      />
    );
  }

  const calculateDrawerWidth = () => {
    const windowWidth = window.innerWidth;
    // For mobile, use a larger percentage of the screen
    const isMobile = windowWidth < 768;
    const width = isMobile ? Math.min(windowWidth * 0.85, 800) : Math.min(windowWidth * 0.3, 800);
    const minWidth = isMobile ? 280 : 320;
    return Math.max(minWidth, width);
  };

  const handleResize = () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      if (props.isOpen && !isDragging() && !isAnimating() && props.drawerWidth === undefined) {
        setDrawerWidth(calculateDrawerWidth());
      }
      resizeTimeout = null;
    }, 150);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (isAnimating()) return;

    setIsDragging(true);
    startX = e.pageX;
    startWidth = drawerWidth();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    const isRightDrawer = props.position === "right";
    const delta = isRightDrawer ? startX - e.pageX : e.pageX - startX;
    const newWidth = Math.max(320, Math.min(1000, startWidth + delta));
    setDrawerWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const animateDrawerOpen = (targetWidth: number) => {
    setIsAnimating(true);

    const startTime = performance.now();
    const duration = 400;
    const startWidth = 1;

    setDrawerWidth(startWidth);

    const animate = (currentTime: number) => {
      if (currentTime === startTime) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const easeOutBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
      };

      const currentWidth = startWidth + (targetWidth - startWidth) * easeOutBack(progress);
      setDrawerWidth(currentWidth);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        animationFrame = null;
        setDrawerWidth(targetWidth);

        animationTimer = window.setTimeout(() => {
          setIsAnimating(false);
          animationTimer = null;
        }, 50);
      }
    };

    animationFrame = requestAnimationFrame(animate);
  };

  const animateDrawerClose = () => {
    setIsAnimating(true);

    const startTime = performance.now();
    const duration = 300;
    const startWidth = drawerWidth();

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const easeOutQuart = (x: number): number => {
        return 1 - Math.pow(1 - x, 4);
      };

      const currentWidth = startWidth - startWidth * easeOutQuart(progress);
      setDrawerWidth(currentWidth);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        animationFrame = null;
        props.onClose();
        setIsAnimating(false);
      }
    };

    animationFrame = requestAnimationFrame(animate);
  };

  const localClose = () => {
    if (isAnimating()) return;
    animateDrawerClose();
  };

  onMount(() => {
    window.addEventListener("resize", handleResize);
  });

  onCleanup(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("resize", handleResize);

    // Clean up animation resources
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    if (animationTimer) {
      clearTimeout(animationTimer);
    }
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
  });

  createEffect(() => {
    if (props.isOpen && !isAnimating() && drawerWidth() === 0 && props.drawerWidth === undefined) {
      const targetWidth = calculateDrawerWidth();
      animateDrawerOpen(targetWidth);
    }
  });

  createEffect(() => {
    if (props.drawerWidth !== undefined && !isAnimating()) {
      if (props.drawerWidth === 0) {
        // If we're collapsing from a non-zero width, animate it
        if (drawerWidth() > 0) {
          const startTime = performance.now();
          const duration = 300;
          const startWidth = drawerWidth();

          const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            const easeOutQuart = (x: number): number => {
              return 1 - Math.pow(1 - x, 4);
            };

            const currentWidth = startWidth - startWidth * easeOutQuart(progress);
            setDrawerWidth(currentWidth);

            if (progress < 1) {
              animationFrame = requestAnimationFrame(animate);
            } else {
              animationFrame = null;
              setDrawerWidth(0);
              setIsAnimating(false);
            }
          };

          setIsAnimating(true);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setDrawerWidth(0);
        }
      } else {
        // If we're expanding from zero, animate it
        if (drawerWidth() === 0) {
          animateDrawerOpen(props.drawerWidth);
        } else {
          setDrawerWidth(props.drawerWidth);
        }
      }
    }
  });

  return (
    <div
      class={`absolute top-0 h-full bg-neutral-900/90 text-white shadow-[0_0_12px_rgba(0,0,0,0.3)] z-20 ${
        props.position === "left" ? "left-0" : "right-0"
      } ${isDragging() ? "select-none" : ""}`}
      style={{
        width: `${drawerWidth()}px`,
        transition: isDragging() ? "none" : undefined,
      }}
    >
      <div
        class={`absolute h-screen w-1.5 bg-neutral-900 cursor-ew-resize select-none ${
          props.position === "left" ? "right-[-2px]" : "left-[-2px]"
        }`}
      >
        <div
          class="absolute inset-0 drawer-handle cursor-ew-resize hover:brightness-125 select-none"
          onMouseDown={handleMouseDown}
        />
      </div>
      <Show when={!props.isCollapsed}>
        <button
          onClick={localClose}
          class="absolute top-4 right-4 p-2 bg-transparent border-none cursor-pointer text-neutral-400 select-none"
        >
          ✕
        </button>
      </Show>
      <div class="h-full overflow-auto">
        <div class="p-8 min-w-[280px]">{props.children}</div>
      </div>
    </div>
  );
}
