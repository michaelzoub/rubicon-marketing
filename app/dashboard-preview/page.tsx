import { CreatorDashboardPreview } from "../_components/marketing/creator-dashboard-preview";

export default function DashboardPreviewPage() {
  return (
    <>
      <img
        src="/Forwriters%20banner.png"
        alt=""
        className="dashboard-preview-banner"
        decoding="async"
        fetchPriority="high"
      />
      <CreatorDashboardPreview />
    </>
  );
}
