type ProviderServiceRegistration = {
  provider: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    meteringUnit: string;
    pricing: {
      currency: "USD";
      pricePerUnit: string;
    };
  };
};

const registration: ProviderServiceRegistration = {
  provider: {
    id: "caliga-compute",
    name: "Caliga Compute",
  },
  service: {
    id: "gpu-image-generation",
    name: "GPU Image Generation",
    description: "Generate images with streamed progress, usage, and output events.",
    capabilities: ["image-generation", "streaming-output", "progress-events"],
    meteringUnit: "gpu_second",
    pricing: {
      currency: "USD",
      pricePerUnit: "0.001",
    },
  },
};

console.log(registration);
