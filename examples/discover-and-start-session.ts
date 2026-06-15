async function discoverAndStartSession() {
  const discovery = await fetch("/api/services");
  const { services } = await discovery.json();

  const service = services.find((entry: { id: string }) => entry.id === "gpu-image-generation");
  if (!service) {
    throw new Error("Service is not active");
  }

  const sessionResponse = await fetch("/api/sessions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      serviceId: service.id,
      input: {
        prompt: "A technical river crossing for autonomous agents",
      },
      maxSpend: "0.10",
    }),
  });

  return sessionResponse.json();
}

discoverAndStartSession();
