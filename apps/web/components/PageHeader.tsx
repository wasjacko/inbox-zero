import { PageHeaderVideoButton } from "@/components/PageHeaderVideoButton";
import { PageHeading, PageSubHeading } from "@/components/Typography";

type Video = {
  title: string;
  description: React.ReactNode;
  youtubeVideoId?: string;
  muxPlaybackId?: string;
};

interface PageHeaderProps {
  actions?: React.ReactNode;
  description?: string;
  title: string;
  video?: Video;
  videoButtonLabel?: string;
}

export function PageHeader({
  actions,
  title,
  video,
  description,
  videoButtonLabel,
}: PageHeaderProps) {
  return (
    <div>
      <div className="mt-6 flex flex-col items-start gap-3 sm:mt-8 sm:flex-row sm:items-center">
        <div>
          <PageHeading>{title}</PageHeading>
          {description && (
            <PageSubHeading className="mt-1">{description}</PageSubHeading>
          )}
        </div>
        {video && (video.youtubeVideoId || video.muxPlaybackId) && (
          <PageHeaderVideoButton label={videoButtonLabel} video={video} />
        )}
        {actions && <div className="ml-auto shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
