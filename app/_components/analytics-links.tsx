"use client";

import Link, { type LinkProps } from "next/link";
import posthog from "posthog-js";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

type AnalyticsLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    location: string;
  };

function currentPathname() {
  return typeof window === "undefined" ? "" : window.location.pathname;
}

export function StartPublishingLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Funnel step: visitor chooses to start the creator publishing flow.
    posthog.capture("start_publishing_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}

export function SignInLink({ location, onClick, ...props }: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Funnel step: visitor chooses to enter the creator sign-in flow.
    posthog.capture("sign_in_clicked", {
      location,
      current_url: currentPathname(),
    });
    onClick?.(event);
  };

  return <Link {...props} onClick={handleClick} />;
}
