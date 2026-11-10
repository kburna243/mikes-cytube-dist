"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { completeOnboarding } from "@/lib/api";

const STEPS = [
  {
    title: "Welcome to The Archive",
    description:
      "Your AI-powered vintage collection platform. Let us set up your archive in under two minutes.",
  },
  {
    title: "Name Your Archive",
    description: "Give your collection a name. You can change this later.",
  },
  {
    title: "What Do You Collect?",
    description:
      "Select your main categories so we can calibrate the AI for your items.",
  },
  {
    title: "You're All Set",
    description: "Your archive is ready. Start adding your first pieces.",
  },
];

const CATEGORIES = [
  "Sneakers",
  "Denim",
  "Leather",
  "Workwear",
  "Streetwear",
  "Sportswear",
  "Military",
  "Designer",
  "Watches",
  "Furniture",
  "Art",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [step, setStep] = useState(0);
  const [archiveName, setArchiveName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const goToDashboard = async () => {
    if (accessToken) {
      setSaving(true);
      try {
        await completeOnboarding(
          {
            tenant_name: archiveName || undefined,
            interests:
              selectedCategories.length > 0 ? selectedCategories : undefined,
          },
          accessToken,
        );
      } catch {
        // Onboarding save failed — continue to dashboard anyway
      }
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F2EFE9] dark:bg-[#1A1A1A] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-primary/10">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-[32rem] w-full text-center">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <>
              <h1 className="font-display-lg text-display-lg text-primary mb-md">
                {STEPS[0].title}
              </h1>
              <p className="text-body-lg text-on-surface-variant mb-xl">
                {STEPS[0].description}
              </p>
              <button
                className="font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 bg-primary text-on-primary hover:bg-secondary transition-colors duration-300"
                onClick={() => setStep(1)}
              >
                Get Started
              </button>
            </>
          )}

          {/* Step 1: Archive Name */}
          {step === 1 && (
            <>
              <span className="font-label-caps text-label-caps text-secondary uppercase mb-md block">
                Step 1 of 3
              </span>
              <h1 className="font-display-sm text-display-sm text-primary mb-sm">
                {STEPS[1].title}
              </h1>
              <p className="text-body-md text-on-surface-variant mb-lg">
                {STEPS[1].description}
              </p>
              <input
                type="text"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="e.g. My Vintage Collection"
                className="w-full px-4 py-3 border border-primary/30 bg-transparent text-primary text-body-md focus:outline-none focus:border-primary mb-lg"
              />
              <div className="flex gap-md justify-center">
                <button
                  className="font-label-caps text-label-caps text-secondary hover:text-primary transition-colors"
                  onClick={() => setStep(0)}
                >
                  Back
                </button>
                <button
                  className="font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 bg-primary text-on-primary hover:bg-secondary transition-colors duration-300"
                  onClick={() => setStep(2)}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 2: Categories */}
          {step === 2 && (
            <>
              <span className="font-label-caps text-label-caps text-secondary uppercase mb-md block">
                Step 2 of 3
              </span>
              <h1 className="font-display-sm text-display-sm text-primary mb-sm">
                {STEPS[2].title}
              </h1>
              <p className="text-body-md text-on-surface-variant mb-lg">
                {STEPS[2].description}
              </p>
              <div className="flex flex-wrap gap-sm justify-center mb-lg">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`px-4 py-2 text-body-sm border transition-colors ${
                      selectedCategories.includes(cat)
                        ? "border-primary bg-primary text-on-primary"
                        : "border-primary/20 text-primary hover:border-primary/50"
                    }`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-md justify-center">
                <button
                  className="font-label-caps text-label-caps text-secondary hover:text-primary transition-colors"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 bg-primary text-on-primary hover:bg-secondary transition-colors duration-300"
                  onClick={() => setStep(3)}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <>
              <div className="text-5xl mb-lg">&#10003;</div>
              <h1 className="font-display-sm text-display-sm text-primary mb-md">
                {STEPS[3].title}
              </h1>
              <p className="text-body-lg text-on-surface-variant mb-lg">
                {STEPS[3].description}
              </p>
              <div className="text-body-md text-on-surface-variant mb-xl space-y-xs">
                {archiveName && (
                  <p>
                    Archive:{" "}
                    <span className="text-primary font-medium">
                      {archiveName}
                    </span>
                  </p>
                )}
                {selectedCategories.length > 0 && (
                  <p>
                    Categories:{" "}
                    <span className="text-primary font-medium">
                      {selectedCategories.join(", ")}
                    </span>
                  </p>
                )}
              </div>
              <button
                className="font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 bg-primary text-on-primary hover:bg-secondary transition-colors duration-300 disabled:opacity-50"
                onClick={goToDashboard}
                disabled={saving}
              >
                {saving ? "Saving…" : "Enter Your Archive"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
