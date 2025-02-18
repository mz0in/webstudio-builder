import { findPageByIdOrPath } from "@webstudio-is/sdk";
import { $isPreviewMode, $pages } from "~/shared/nano-states";
import { switchPage } from "~/shared/pages";

const isAbsoluteUrl = (href: string) => {
  try {
    new URL(href);
    return true;
  } catch {
    return false;
  }
};

const handleLinkClick = (element: HTMLAnchorElement) => {
  const pages = $pages.get();
  const href = element.getAttribute("href");
  if (href === null || pages === undefined) {
    return;
  }

  if (isAbsoluteUrl(href)) {
    window.open(href, "_blank");
    return;
  }

  const pageHref = new URL(href, "https://any-valid.url");
  const page = findPageByIdOrPath(pageHref.pathname, pages);
  if (page) {
    switchPage(page.id, pageHref.hash);
    return;
  }
};

export const subscribeInterceptedEvents = () => {
  const handleClick = (event: MouseEvent) => {
    if (
      event.target instanceof HTMLElement ||
      event.target instanceof SVGElement
    ) {
      const a = event.target.closest("a");
      if (a) {
        event.preventDefault();
        if ($isPreviewMode.get()) {
          handleLinkClick(a);
        }
      }
      // prevent invoking submit with buttons in canvas mode
      // because form with prevented submit still invokes validation
      if (event.target.closest("button") && $isPreviewMode.get() === false) {
        event.preventDefault();
      }
    }
  };
  const handleSubmit = (event: SubmitEvent) => {
    // prevent submitting the form when clicking a button type submit
    event.preventDefault();
  };
  const handleKeydown = (event: KeyboardEvent) => {
    if ($isPreviewMode.get()) {
      return;
    }
    // prevent typing in inputs only in canvas mode
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      event.preventDefault();
    }
  };

  // Note: Event handlers behave unexpectedly when used inside a dialog component.
  // In Dialogs, React intercepts and processes events before they reach our handlers.
  // To ensure consistent behavior across all components, we're using event capturing.
  // This allows us to intercept events before React gets a chance to handle them.
  document.documentElement.addEventListener("click", handleClick, {
    capture: true,
  });
  document.documentElement.addEventListener("submit", handleSubmit, {
    capture: true,
  });

  document.documentElement.addEventListener("keydown", handleKeydown);
  return () => {
    document.documentElement.removeEventListener("click", handleClick, {
      capture: true,
    });
    document.documentElement.removeEventListener("submit", handleSubmit, {
      capture: true,
    });
    document.documentElement.removeEventListener("keydown", handleKeydown);
  };
};
