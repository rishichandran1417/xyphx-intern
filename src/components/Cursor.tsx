import { useEffect, useRef } from "react";

export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable custom cursor on touch devices and reduced-motion users
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let dot = { x: mouse.x, y: mouse.y };
    let ring = { x: mouse.x, y: mouse.y };

    const dotSpeed = 1;
    const ringSpeed = 0.18;

    const move = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", move);

    let raf: number;

    const animate = () => {
      dot.x += (mouse.x - dot.x) * dotSpeed;
      dot.y += (mouse.y - dot.y) * dotSpeed;

      ring.x += (mouse.x - ring.x) * ringSpeed;
      ring.y += (mouse.y - ring.y) * ringSpeed;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(animate);
    };

    animate();

    const interactive = document.querySelectorAll(
      "a, button, .btn, input, textarea, select, [role='button']"
    );

    const enter = () => {
      if (ringRef.current) {
        ringRef.current.classList.remove("w-[28px]", "h-[28px]");
        ringRef.current.classList.add("w-[40px]", "h-[40px]");
      }
      if (dotRef.current) {
        dotRef.current.classList.remove("w-[6px]", "h-[6px]");
        dotRef.current.classList.add("w-[10px]", "h-[10px]");
      }
    };

    const leave = () => {
      if (ringRef.current) {
        ringRef.current.classList.remove("w-[40px]", "h-[40px]");
        ringRef.current.classList.add("w-[28px]", "h-[28px]");
      }
      if (dotRef.current) {
        dotRef.current.classList.remove("w-[10px]", "h-[10px]");
        dotRef.current.classList.add("w-[6px]", "h-[6px]");
      }
    };

    interactive.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      interactive.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return (
    <>
      {/* RING */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] w-[28px] h-[28px] border-[1.5px] border-xyphx-purple rounded-full transition-[width,height] duration-250 ease-out will-change-[width,height,transform]"
      />
      {/* DOT */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-[6px] h-[6px] bg-xyphx-purple rounded-full transition-[width,height] duration-250 ease-out will-change-[width,height,transform]"
      />
    </>
  );
}
