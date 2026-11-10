"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { TechnicalLine } from "@/components/ui/TechnicalLine";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-surface p-8">
      <div className="w-full max-w-[28rem] border-2 border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          {icon || <DefaultIcon />}
        </div>

        {/* Title — serif italic archive heading */}
        <h2 className="font-headline-sm italic text-primary">{title}</h2>

        {/* Description */}
        {description && (
          <p className="font-body-md mt-4 text-on-surface-variant">
            {description}
          </p>
        )}

        {/* Technical divider */}
        {action && <TechnicalLine className="my-8" />}

        {/* Action button */}
        {action && (
          <div className={description ? "mt-0" : "mt-8"}>
            <Button
              variant="secondary"
              href={action.href}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultIcon() {
  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-20 items-center justify-center border border-outline-variant bg-surface-container"
    >
      {/* Empty rectangle — archival placeholder */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-outline"
      >
        <rect
          x="4"
          y="4"
          width="24"
          height="24"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <line
          x1="4"
          y1="12"
          x2="28"
          y2="12"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="12"
          y1="4"
          x2="12"
          y2="28"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

export default EmptyState;
