import TrackClient from "./track-client";

export default function TrackPage({ searchParams }: { searchParams: { order?: string } }) {
  return <TrackClient initialOrder={searchParams.order || ""} />;
}

