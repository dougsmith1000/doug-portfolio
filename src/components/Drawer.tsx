import { createSignal, JSX, onCleanup, createEffect, onMount } from "solid-js";
import { isServer } from "solid-js/web";

interface DrawerProps {
  position: "left" | "right";
  isOpen: boolean;
  onClose: () => void;
  children: JSX.Element;
  drawerWidth?: number;
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

  // Skip browser-specific code on the server
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
    const width = Math.min(windowWidth * 0.3, 800);
    const minWidth = 320;
    return Math.max(minWidth, width);
  };

  // Debounced resize handler
  const handleResize = () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      if (props.isOpen && !isDragging() && !isAnimating()) {
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

  // Animate drawer opening with performance.now() for precise timing
  const animateDrawerOpen = (targetWidth: number) => {
    // Begin animation - prevents other animations from starting
    setIsAnimating(true);

    // Get current time for animation
    const startTime = performance.now();
    const duration = 400; // Match CSS var --drawer-open-time (in ms)
    const startWidth = 1; // Start with 1px width instead of 0 to ensure it's immediately visible

    // Set initial width
    setDrawerWidth(startWidth);

    // Animation function
    const animate = (currentTime: number) => {
      // Ensure at least one frame has passed to prevent immediate jumps
      if (currentTime === startTime) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Custom easing function with overshoot for a more dynamic feel
      const easeOutBack = (x: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
      };

      // Calculate current width with easing
      const currentWidth = startWidth + (targetWidth - startWidth) * easeOutBack(progress);
      setDrawerWidth(currentWidth);

      // Continue animation if not complete
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Clean up animation
        animationFrame = null;
        // Ensure final width is exactly the target
        setDrawerWidth(targetWidth);

        // Give a small buffer before allowing other animations
        animationTimer = window.setTimeout(() => {
          setIsAnimating(false);
          animationTimer = null;
        }, 50);
      }
    };

    // Start animation
    animationFrame = requestAnimationFrame(animate);
  };

  // Animate drawer closing with performance.now() for precise timing
  const animateDrawerClose = () => {
    // Begin animation
    setIsAnimating(true);

    // Get current time for animation
    const startTime = performance.now();
    const duration = 300; // Slightly faster close animation
    const startWidth = drawerWidth();

    // Animation function
    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Simple ease-out function for a smooth exit
      const easeOutQuart = (x: number): number => {
        return 1 - Math.pow(1 - x, 4);
      };

      // Calculate current width with easing
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
    if (props.isOpen && !isAnimating() && drawerWidth() === 0) {
      const targetWidth = calculateDrawerWidth();
      animateDrawerOpen(targetWidth);
    }
  });

  createEffect(() => {
    if (props.drawerWidth !== undefined && !isAnimating() && !isDragging()) {
      setDrawerWidth(props.drawerWidth);
    }
  });

  return (
    <div
      class={`absolute top-0 h-full bg-neutral-900/90 text-white shadow-[0_0_12px_rgba(0,0,0,0.3)] z-20 ${
        props.position === "left" ? "left-0" : "right-0"
      }`}
      style={{
        width: `${drawerWidth()}px`,
        transition: isDragging() ? "none" : undefined,
      }}
    >
      <div
        class={`absolute h-screen w-1.5 bg-neutral-900 cursor-ew-resize ${
          props.position === "left" ? "right-[-2px]" : "left-[-2px]"
        }`}
      >
        <div
          class="absolute inset-0 drawer-handle cursor-ew-resize hover:brightness-125"
          onMouseDown={handleMouseDown}
        />
      </div>
      <button
        onClick={localClose}
        class="absolute top-4 right-4 p-2 bg-transparent border-none cursor-pointer text-neutral-400"
      >
        ✕
      </button>
      <div class="h-full overflow-auto">
        <div class="p-8 min-w-[320px]">{props.children}</div>
      </div>
    </div>
  );
}
