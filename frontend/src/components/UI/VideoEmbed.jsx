import { MdOpenInNew } from 'react-icons/md';
import { parseVideo } from './videoUrl.js';

const LABEL = { facebook: 'Facebook', youtube: 'YouTube' };

export default function VideoEmbed({ url, title }) {
  const video = parseVideo(url);

  if (!video) {
    return (
      <a className="video-embed-fallback" href={url} target="_blank" rel="noopener noreferrer">
        <MdOpenInNew size={18} /> Open video
      </a>
    );
  }

  return (
    <div className={`video-embed ${video.vertical ? 'is-vertical' : ''}`}>
      <div className="video-embed-frame">
        <iframe
          src={video.src}
          title={title || `${LABEL[video.platform]} video`}
          loading="lazy"
          // YouTube refuses to play (error 153) when the embed gets no referrer
          referrerPolicy="strict-origin-when-cross-origin"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {/* Private or embed-disabled videos render an error inside the player —
          this link is the way out in that case. */}
      <a className="video-embed-source" href={url} target="_blank" rel="noopener noreferrer">
        Open on {LABEL[video.platform]} <MdOpenInNew size={13} />
      </a>
    </div>
  );
}
