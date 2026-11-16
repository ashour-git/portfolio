/**
 * Runs before first paint: marks JS as available (enables reveal motion)
 * and applies the stored theme, falling back to the OS preference.
 */
export function ThemeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var d=document.documentElement;d.classList.add("js");var t="dark";try{var s=localStorage.getItem("theme");if(s==="light"||s==="dark"){t=s;}else if(window.matchMedia("(prefers-color-scheme: light)").matches){t="light";}}catch(e){}d.setAttribute("data-theme",t);})();`,
      }}
    />
  );
}
